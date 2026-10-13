package hu.campus.lostfound.report;

import static org.assertj.core.api.Assertions.assertThat;

import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ReportTest {

    @Test
    void closeSetsStatusToClosed() {
        Report report = newOpenReport();

        report.close();

        assertThat(report.getStatus()).isEqualTo(ReportStatus.CLOSED);
    }

    @Test
    void closeIsIdempotent() {
        Report report = newOpenReport();

        report.close();
        report.close();

        assertThat(report.getStatus()).isEqualTo(ReportStatus.CLOSED);
    }

    private static Report newOpenReport() {
        User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(),
                item,
                reporter,
                ReportType.FOUND,
                ReportStatus.OPEN,
                "Main hall",
                LocalDate.now(),
                "anna@example.com",
                Instant.now()
        );
    }
}
