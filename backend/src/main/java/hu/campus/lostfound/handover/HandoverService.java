package hu.campus.lostfound.handover;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimMapper;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
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

    public HandoverService(HandoverRepository handoverRepository, AuthSupport authSupport) {
        this.handoverRepository = handoverRepository;
        this.authSupport = authSupport;
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
        boolean isReporter = claim.getReport().getReporter().getId().equals(currentId);
        boolean isClaimant = claim.getClaimant().getId().equals(currentId);
        if (!isReporter && !isClaimant) {
            throw new ForbiddenException("Only the reporter or claimant can confirm handover");
        }
        if (handover.isConfirmed()) {
            throw new BadRequestException("This item was already handed over");
        }
        Instant now = Instant.now();
        handover.confirm(now);
        handover.getClaim().getReport().setStatus(ReportStatus.CLOSED);
        return ClaimMapper.toResponse(handover);
    }

    private static HandoverListItemResponse toListItem(Handover handover, UUID viewerId) {
        Claim claim = handover.getClaim();
        Report report = claim.getReport();
        String reporterName = report.getReporter().getDisplayName();
        String claimantName = claim.getClaimant().getDisplayName();
        String yourRole = report.getReporter().getId().equals(viewerId) ? "REPORTER" : "CLAIMANT";
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
