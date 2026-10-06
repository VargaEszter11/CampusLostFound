package hu.campus.lostfound.handover;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.notification.NotificationService;
import hu.campus.lostfound.notification.NotificationType;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HandoverService {

    private final HandoverRepository handoverRepository;
    private final AuthSupport authSupport;
    private final NotificationService notificationService;
    private final ReportAccess reportAccess;

    public HandoverService(
            HandoverRepository handoverRepository,
            AuthSupport authSupport,
            NotificationService notificationService,
            ReportAccess reportAccess
    ) {
        this.handoverRepository = handoverRepository;
        this.authSupport = authSupport;
        this.notificationService = notificationService;
        this.reportAccess = reportAccess;
    }

    @Transactional(readOnly = true)
    public List<HandoverListItemResponse> listForCurrentUser() {
        User current = authSupport.requireUser();
        return handoverRepository.findByParticipantId(current.getId()).stream()
                .map(h -> toListItem(h, current.getId()))
                .toList();
    }

    @Transactional
    public HandoverResponse confirm(UUID handoverId) {
        Handover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new NotFoundException("Handover not found: " + handoverId));
        User current = authSupport.requireUser();
        Claim claim = handover.getClaim();
        UUID currentId = current.getId();
        boolean isReporter = reportAccess.isReporter(claim.getReport(), currentId);
        boolean isClaimant = claim.getClaimant().getId().equals(currentId);
        if (!isReporter && !isClaimant) {
            throw new ForbiddenException("Only the reporter or claimant can confirm handover");
        }
        if (handover.isConfirmed()) {
            throw new BadRequestException("This item was already handed over");
        }
        Instant now = Instant.now();
        handover.confirm(now);
        Report report = handover.getClaim().getReport();
        report.close();

        User recipient = isReporter ? claim.getClaimant() : claim.getReport().getReporter();
        String itemName = report.getItem().getName();
        notificationService.notify(
                recipient,
                NotificationType.HANDOVER_CONFIRMED,
                "Handover confirmed",
                "Handover confirmed for \"" + itemName + "\".",
                report.getId(),
                claim.getId(),
                handover.getId()
        );

        return HandoverMapper.toResponse(handover);
    }

    private HandoverListItemResponse toListItem(Handover handover, UUID viewerId) {
        Claim claim = handover.getClaim();
        Report report = claim.getReport();
        String reporterName = report.getReporter().getDisplayName();
        String claimantName = claim.getClaimant().getDisplayName();
        String yourRole = reportAccess.isReporter(report, viewerId) ? "REPORTER" : "CLAIMANT";
        return new HandoverListItemResponse(
                handover.getId(),
                claim.getId(),
                report.getId(),
                report.getItem().getName(),
                report.getType(),
                handover.getHandoverCode(),
                handover.isConfirmed(),
                handover.getConfirmedAt(),
                reporterName,
                claimantName,
                claim.getClaimantContact(),
                report.getReporterContact(),
                yourRole
        );
    }
}
