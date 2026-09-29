package hu.campus.lostfound.report;

import java.util.UUID;

public record ItemResponse(
        UUID id,
        String name,
        String description,
        String category
) {
}
