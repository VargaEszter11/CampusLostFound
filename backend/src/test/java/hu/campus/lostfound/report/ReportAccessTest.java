package hu.campus.lostfound.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ReportAccessTest {

    private final ReportAccess reportAccess = new ReportAccess();

    @Test
    void isReporterTrueForMatchingId() {
        User reporter = user();
        Report report = reportBy(reporter);

        assertThat(reportAccess.isReporter(report, reporter.getId())).isTrue();
    }

    @Test
    void isReporterFalseForOtherId() {
        Report report = reportBy(user());

        assertThat(reportAccess.isReporter(report, UUID.randomUUID())).isFalse();
    }

    @Test
    void requireReporterPassesForOwner() {
        User reporter = user();
        Report report = reportBy(reporter);

        reportAccess.requireReporter(report, reporter, "close this report");
    }

    @Test
    void requireReporterThrowsForNonOwner() {
        Report report = reportBy(user());
        User other = user();

        assertThatThrownBy(() -> reportAccess.requireReporter(report, other, "close this report"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Only the reporter can close this report");
    }

    private static User user() {
        return new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    }

    private static Report reportBy(User reporter) {
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
