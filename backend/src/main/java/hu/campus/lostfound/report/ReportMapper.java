package hu.campus.lostfound.report;

import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ItemResponse;
import hu.campus.lostfound.report.ReportResponse;

public final class ReportMapper {

    private ReportMapper() {
    }

    public static ReportResponse toResponse(Report report, boolean revealContact) {
        return new ReportResponse(
                report.getId(),
                report.getType(),
                toItemResponse(report.getItem()),
                report.getLocation(),
                report.getOccurredOn(),
                report.getReporter().getDisplayName(),
                revealContact ? report.getReporterContact() : null,
                report.getStatus(),
                report.getCreatedAt()
        );
    }

    public static ItemResponse toItemResponse(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getCategory()
        );
    }
}
