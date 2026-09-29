package hu.campus.lostfound.claim;

import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.handover.HandoverResponse;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.shared.BadRequestException;
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

    public ClaimService(
            ClaimRepository claimRepository,
            HandoverRepository handoverRepository,
            ReportService reportService,
            UserService userService
    ) {
        this.claimRepository = claimRepository;
        this.handoverRepository = handoverRepository;
        this.reportService = reportService;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> listForReport(UUID reportId) {
        reportService.requireReport(reportId);
        return claimRepository.findByReportIdOrderByCreatedAtAsc(reportId).stream()
                .map(ClaimMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> listForClaimant(String claimantName) {
        if (claimantName == null || claimantName.isBlank()) {
            throw new BadRequestException("claimantName is required");
        }
        return claimRepository
                .findByClaimant_DisplayNameIgnoreCaseOrderByCreatedAtDesc(claimantName.trim())
                .stream()
                .map(ClaimMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<HandoverResponse> findHandoverForReport(UUID reportId) {
        reportService.requireReport(reportId);
        return handoverRepository.findApprovedForReport(reportId).map(ClaimMapper::toResponse);
    }

    @Transactional
    public ClaimResponse create(CreateClaimRequest request) {
        userService.validateContact(request.claimantContact());

        Report report = reportService.requireReport(request.reportId());
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BadRequestException("This item was already handed over");
        }
        if (handoverRepository.findApprovedForReport(report.getId()).isPresent()) {
            throw new BadRequestException("This report already has an approved claim");
        }

        String claimantName = request.claimantName().trim();
        if (report.getReporter().getDisplayName().equalsIgnoreCase(claimantName)) {
            throw new BadRequestException("You cannot claim your own report");
        }

        User claimant = userService.resolveOrCreate(claimantName, request.claimantContact().trim());
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
        if (handover.isConfirmed()) {
            throw new BadRequestException("This item was already handed over");
        }

        Instant now = Instant.now();
        handover.confirm(now);
        Report report = handover.getClaim().getReport();
        report.setStatus(ReportStatus.CLOSED);
        return ClaimMapper.toResponse(handover);
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
