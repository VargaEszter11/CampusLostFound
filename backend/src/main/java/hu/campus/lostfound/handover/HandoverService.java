package hu.campus.lostfound.handover;

import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.claim.ClaimMapper;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.handover.HandoverListItemResponse;
import hu.campus.lostfound.handover.HandoverResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HandoverService {

    private final HandoverRepository handoverRepository;

    public HandoverService(HandoverRepository handoverRepository) {
        this.handoverRepository = handoverRepository;
    }

    @Transactional(readOnly = true)
    public List<HandoverListItemResponse> listForParticipant(String participantName) {
        if (participantName == null || participantName.isBlank()) {
            throw new BadRequestException("participantName is required");
        }
        String name = participantName.trim();
        return handoverRepository.findByParticipantNameIgnoreCase(name).stream()
                .map(h -> toListItem(h, name))
                .toList();
    }

    @Transactional
    public HandoverResponse confirm(UUID handoverId) {
        Handover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new NotFoundException("Handover not found: " + handoverId));
        if (handover.isConfirmed()) {
            throw new BadRequestException("This item was already handed over");
        }
        Instant now = Instant.now();
        handover.confirm(now);
        handover.getClaim().getReport().setStatus(ReportStatus.CLOSED);
        return ClaimMapper.toResponse(handover);
    }

    private static HandoverListItemResponse toListItem(Handover handover, String viewerName) {
        Claim claim = handover.getClaim();
        Report report = claim.getReport();
        String reporterName = report.getReporter().getDisplayName();
        String claimantName = claim.getClaimant().getDisplayName();
        String yourRole = reporterName.equalsIgnoreCase(viewerName) ? "REPORTER" : "CLAIMANT";
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
