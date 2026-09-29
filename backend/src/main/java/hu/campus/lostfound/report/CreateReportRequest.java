package hu.campus.lostfound.report;

import hu.campus.lostfound.report.ReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateReportRequest(
        @NotNull ReportType type,
        @NotBlank @Size(max = 255) String itemName,
        @Size(max = 4000) String itemDescription,
        @Size(max = 100) String itemCategory,
        @NotBlank @Size(max = 255) String location,
        @NotNull @PastOrPresent LocalDate date,
        @NotBlank @Size(max = 255) String reporterName,
        @NotBlank @Size(max = 255) String reporterContact
) {
}
