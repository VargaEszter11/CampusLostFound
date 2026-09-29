package hu.campus.lostfound.handover;

import java.time.Instant;
import java.util.UUID;

public record HandoverResponse(
        UUID id,
        UUID claimId,
        String handoverCode,
        boolean confirmed,
        Instant date
) {
}
