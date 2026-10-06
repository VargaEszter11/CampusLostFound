package hu.campus.lostfound.workflow;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimRepository;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverMapper;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.handover.HandoverResponse;
import hu.campus.lostfound.notification.NotificationService;
import hu.campus.lostfound.notification.NotificationType;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalService {

    private final ClaimRepository claimRepository;
    private final HandoverRepository handoverRepository;
    private final AuthSupport authSupport;
    private final NotificationService notificationService;
    private final ReportAccess reportAccess;

    public ApprovalService(
            ClaimRepository claimRepository,
            HandoverRepository handoverRepository,
            AuthSupport authSupport,
            NotificationService notificationService,
            ReportAccess reportAccess
    ) {
        this.claimRepository = claimRepository;
        this.handoverRepository = handoverRepository;
        this.authSupport = authSupport;
        this.notificationService = notificationService;
        this.reportAccess = reportAccess;
    }

    @Transactional
    public HandoverResponse approve(UUID claimId) {
        Claim claim = requireClaim(claimId);
        User current = authSupport.requireUser();
        reportAccess.requireReporter(claim.getReport(), current, "approve claims");

        Report report = claim.getReport();
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BadRequestException("This item was already handed over");
        }
        if (handoverRepository.findApprovedForReport(report.getId()).isPresent()) {
            throw new BadRequestException("This report already has an approved claim");
        }

        claim.approve();
        List<Claim> autoRejected = new ArrayList<>();
        for (Claim other : claimRepository.findByReportIdOrderByCreatedAtAsc(report.getId())) {
            if (!other.getId().equals(claimId) && other.getStatus() == ClaimStatus.PENDING) {
                other.reject();
                autoRejected.add(other);
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

        String itemName = report.getItem().getName();
        notificationService.notify(
                claim.getClaimant(),
                NotificationType.CLAIM_APPROVED,
                "Claim approved",
                "Your claim on \"" + itemName + "\" was approved. A handover code is ready.",
                report.getId(),
                claim.getId(),
                handover.getId()
        );
        for (Claim rejected : autoRejected) {
            notificationService.notify(
                    rejected.getClaimant(),
                    NotificationType.CLAIM_REJECTED,
                    "Claim rejected",
                    "Your claim on \"" + itemName + "\" was rejected because another claim was approved.",
                    report.getId(),
                    rejected.getId(),
                    null
            );
        }

        return HandoverMapper.toResponse(handover);
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
}
