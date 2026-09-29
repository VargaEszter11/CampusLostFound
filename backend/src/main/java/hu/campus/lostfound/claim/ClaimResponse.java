package hu.campus.lostfound.claim;

import hu.campus.lostfound.claim.ClaimStatus;
import java.util.UUID;

public record ClaimResponse(
        UUID id,
        UUID reportId,
        String claimantName,
        String claimantContact,
        String reason,
        ClaimStatus status
) {
}
