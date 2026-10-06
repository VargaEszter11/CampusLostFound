package hu.campus.lostfound.claim;

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
}
