package hu.campus.lostfound.claim;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.handover.HandoverResponse;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final HandoverRepository handoverRepository;
    private final ReportService reportService;
    private final UserService userService;
    private final AuthSupport authSupport;

    public ClaimService(
            ClaimRepository claimRepository,
            HandoverRepository handoverRepository,
            ReportService reportService,
            UserService userService,
            AuthSupport authSupport
    ) {
        this.claimRepository = claimRepository;
        this.handoverRepository = handoverRepository;
        this.reportService = reportService;
        this.userService = userService;
        this.authSupport = authSupport;
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> listForReport(UUID reportId) {
        Report report = reportService.requireReport(reportId);
        User current = authSupport.requireUser();
        if (!report.getReporter().getId().equals(current.getId())) {
            throw new ForbiddenException("Only the reporter can view claims on this report");
        }
        return claimRepository.findByReportIdOrderByCreatedAtAsc(reportId).stream()
                .map(ClaimMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> listForCurrentUser() {
        UUID userId = authSupport.requireUserId();
        return claimRepository
                .findByClaimant_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ClaimMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<HandoverResponse> findHandoverForReport(UUID reportId) {
        Report report = reportService.requireReport(reportId);
        User current = authSupport.requireUser();
        Optional<Handover> handover = handoverRepository.findApprovedForReport(reportId);
        if (handover.isEmpty()) {
            return Optional.empty();
        }
        assertCanViewHandover(report, handover.get(), current);
        return handover.map(ClaimMapper::toResponse);
    }

    @Transactional
    public ClaimResponse create(CreateClaimRequest request) {
        userService.validateContact(request.claimantContact());
        User claimant = authSupport.requireUser();

        Report report = reportService.requireReport(request.reportId());
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BadRequestException("This item was already handed over");
        }
        if (handoverRepository.findApprovedForReport(report.getId()).isPresent()) {
            throw new BadRequestException("This report already has an approved claim");
        }
        if (report.getReporter().getId().equals(claimant.getId())) {
            throw new BadRequestException("You cannot claim your own report");
        }

        Claim claim = new Claim(
                UUID.randomUUID(),
                report,
                claimant,
                request.claimantContact().trim(),
                blankToNull(request.reason()),
                ClaimStatus.PENDING,
                Instant.now()
        );
        claimRepository.save(claim);
        return ClaimMapper.toResponse(claim);
    }

    @Transactional
    public HandoverResponse approve(UUID claimId) {
        Claim claim = requireClaim(claimId);
        User current = authSupport.requireUser();
        if (!claim.getReport().getReporter().getId().equals(current.getId())) {
            throw new ForbiddenException("Only the reporter can approve claims");
        }
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("This claim was already resolved");
        }

        Report report = claim.getReport();
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BadRequestException("This item was already handed over");
        }
        if (handoverRepository.findApprovedForReport(report.getId()).isPresent()) {
            throw new BadRequestException("This report already has an approved claim");
        }

        claim.setStatus(ClaimStatus.APPROVED);
        for (Claim other : claimRepository.findByReportIdOrderByCreatedAtAsc(report.getId())) {
            if (!other.getId().equals(claimId) && other.getStatus() == ClaimStatus.PENDING) {
                other.setStatus(ClaimStatus.REJECTED);
            }
        }

        Handover handover = new Handover(
                UUID.randomUUID(),
                claim,
                nextHandoverCode(),
                false,
                null
        );
        handoverRepository.save(handover);
        return ClaimMapper.toResponse(handover);
    }

    @Transactional
    public ClaimResponse reject(UUID claimId) {
        Claim claim = requireClaim(claimId);
        User current = authSupport.requireUser();
        if (!claim.getReport().getReporter().getId().equals(current.getId())) {
            throw new ForbiddenException("Only the reporter can reject claims");
        }
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("This claim was already resolved");
        }
        claim.setStatus(ClaimStatus.REJECTED);
        return ClaimMapper.toResponse(claim);
    }

    @Transactional
    public HandoverResponse confirmHandover(UUID reportId) {
        Handover handover = handoverRepository.findApprovedForReport(reportId)
                .orElseThrow(() -> new BadRequestException("No approved claim to hand over"));
        User current = authSupport.requireUser();
        assertCanConfirm(handover, current);
        if (handover.isConfirmed()) {
            throw new BadRequestException("This item was already handed over");
        }

        Instant now = Instant.now();
        handover.confirm(now);
        Report report = handover.getClaim().getReport();
        report.setStatus(ReportStatus.CLOSED);
        return ClaimMapper.toResponse(handover);
    }

    private void assertCanViewHandover(Report report, Handover handover, User current) {
        UUID currentId = current.getId();
        boolean isReporter = report.getReporter().getId().equals(currentId);
        boolean isClaimant = handover.getClaim().getClaimant().getId().equals(currentId);
        if (!isReporter && !isClaimant) {
            throw new ForbiddenException("You cannot view this handover");
        }
    }

    private void assertCanConfirm(Handover handover, User current) {
        UUID currentId = current.getId();
        Claim claim = handover.getClaim();
        boolean isReporter = claim.getReport().getReporter().getId().equals(currentId);
        boolean isClaimant = claim.getClaimant().getId().equals(currentId);
        if (!isReporter && !isClaimant) {
            throw new ForbiddenException("Only the reporter or claimant can confirm handover");
        }
    }

    private Claim requireClaim(UUID claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found: " + claimId));
    }

    private String nextHandoverCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = String.format(
                    Locale.ROOT,
                    "%06d",
                    ThreadLocalRandom.current().nextInt(100_000, 1_000_000)
            );
            if (handoverRepository.findByHandoverCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate a unique handover code");
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
