package hu.campus.lostfound.report;

import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        ReportType type,
        ItemResponse item,
        String location,
        LocalDate date,
        String reporterName,
        String reporterContact,
        ReportStatus status,
        Instant createdAt
) {
}
