package hu.campus.lostfound.claim;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.notification.NotificationService;
import hu.campus.lostfound.notification.NotificationType;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ReportService reportService;
    private final UserService userService;
    private final AuthSupport authSupport;
    private final NotificationService notificationService;
    private final ReportAccess reportAccess;

    public ClaimService(
            ClaimRepository claimRepository,
            ReportService reportService,
            UserService userService,
            AuthSupport authSupport,
            NotificationService notificationService,
            ReportAccess reportAccess
    ) {
        this.claimRepository = claimRepository;
        this.reportService = reportService;
        this.userService = userService;
        this.authSupport = authSupport;
        this.notificationService = notificationService;
        this.reportAccess = reportAccess;
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> listForReport(UUID reportId) {
        Report report = reportService.requireReport(reportId);
        User current = authSupport.requireUser();
        reportAccess.requireReporter(report, current, "view claims on this report");
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

    @Transactional
    public ClaimResponse create(CreateClaimRequest request) {
        userService.validateContact(request.claimantContact());
        User claimant = authSupport.requireUser();

        Report report = reportService.requireReport(request.reportId());
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BadRequestException("This item was already handed over");
        }
        if (claimRepository.existsByReport_IdAndStatus(report.getId(), ClaimStatus.APPROVED)) {
            throw new BadRequestException("This report already has an approved claim");
        }
        if (reportAccess.isReporter(report, claimant.getId())) {
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

        String itemName = report.getItem().getName();
        notificationService.notify(
                report.getReporter(),
                NotificationType.CLAIM_CREATED,
                "New claim on \"" + itemName + "\"",
                claimant.getDisplayName() + " submitted a claim on your report.",
                report.getId(),
                claim.getId(),
                null
        );

        return ClaimMapper.toResponse(claim);
    }

    @Transactional
    public ClaimResponse reject(UUID claimId) {
        Claim claim = requireClaim(claimId);
        User current = authSupport.requireUser();
        reportAccess.requireReporter(claim.getReport(), current, "reject claims");
        claim.reject();

        Report report = claim.getReport();
        String itemName = report.getItem().getName();
        notificationService.notify(
                claim.getClaimant(),
                NotificationType.CLAIM_REJECTED,
                "Claim rejected",
                "Your claim on \"" + itemName + "\" was rejected.",
                report.getId(),
                claim.getId(),
                null
        );

        return ClaimMapper.toResponse(claim);
    }

    private Claim requireClaim(UUID claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found: " + claimId));
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
