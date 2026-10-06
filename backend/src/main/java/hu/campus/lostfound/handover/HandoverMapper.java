package hu.campus.lostfound.handover;

public final class HandoverMapper {

    private HandoverMapper() {
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
