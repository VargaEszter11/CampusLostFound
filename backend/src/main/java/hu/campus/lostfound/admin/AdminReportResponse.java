package hu.campus.lostfound.admin;

import hu.campus.lostfound.report.ItemResponse;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AdminReportResponse(
        UUID id,
        ReportType type,
        ItemResponse item,
        String location,
        LocalDate date,
        String reporterName,
        String reporterEmail,
        String reporterContact,
        ReportStatus status,
        Instant createdAt,
        int claimCount,
        int pendingClaimCount,
        HandoverSummary handover
) {

    public record HandoverSummary(
            UUID id,
            String claimantName,
            String claimantEmail,
            String claimantContact,
            String handoverCode,
            boolean confirmed,
            Instant confirmedAt
    ) {
    }
}
