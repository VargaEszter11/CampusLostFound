package hu.campus.lostfound.claim;

import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.claim.ClaimResponse;
import hu.campus.lostfound.handover.HandoverResponse;

public final class ClaimMapper {

    private ClaimMapper() {
    }

    public static ClaimResponse toResponse(Claim claim) {
        return new ClaimResponse(
                claim.getId(),
                claim.getReport().getId(),
                claim.getClaimant().getDisplayName(),
                claim.getClaimantContact(),
                claim.getReason(),
                claim.getStatus()
        );
    }

    public static HandoverResponse toResponse(Handover handover) {
        return new HandoverResponse(
                handover.getId(),
                handover.getClaim().getId(),
                handover.getHandoverCode(),
                handover.isConfirmed(),
                handover.getConfirmedAt()
        );
    }
}
