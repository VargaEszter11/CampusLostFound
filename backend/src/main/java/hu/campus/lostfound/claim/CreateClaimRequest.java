package hu.campus.lostfound.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateClaimRequest(
        @NotNull UUID reportId,
        @NotBlank @Size(max = 255) String claimantContact,
        @Size(max = 4000) String reason
) {
}
