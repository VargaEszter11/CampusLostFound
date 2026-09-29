package hu.campus.lostfound.handover;

import hu.campus.lostfound.report.ReportType;
import java.time.Instant;
import java.util.UUID;

public record HandoverListItemResponse(
        UUID id,
        UUID claimId,
        UUID reportId,
        String itemName,
        ReportType reportType,
        String handoverCode,
        boolean confirmed,
        Instant date,
        String reporterName,
        String claimantName,
        String claimantContact,
        String reporterContact,
        String yourRole
) {
}
