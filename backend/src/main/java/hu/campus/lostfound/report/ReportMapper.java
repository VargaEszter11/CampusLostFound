package hu.campus.lostfound.report;

import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ItemResponse;
import hu.campus.lostfound.report.ReportResponse;

public final class ReportMapper {

    private ReportMapper() {
    }

    public static ReportResponse toResponse(Report report, boolean revealContact) {
        Item item = report.getItem();
        return new ReportResponse(
                report.getId(),
                report.getType(),
                new ItemResponse(
                        item.getId(),
                        item.getName(),
                        item.getDescription(),
                        item.getCategory()
                ),
                report.getLocation(),
                report.getOccurredOn(),
                report.getReporter().getDisplayName(),
                revealContact ? report.getReporterContact() : null,
                report.getStatus(),
                report.getCreatedAt()
        );
    }
}
