package hu.campus.lostfound.handover;

import static org.assertj.core.api.Assertions.assertThat;

import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class HandoverTest {

    @Test
    void confirmSetsConfirmedAndTimestamp() {
        Handover handover = newHandover();
        Instant now = Instant.now();

        handover.confirm(now);

        assertThat(handover.isConfirmed()).isTrue();
        assertThat(handover.getConfirmedAt()).isEqualTo(now);
    }

    private static Handover newHandover() {
        User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        Report report = new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
        Claim claim = new Claim(
                UUID.randomUUID(), report, claimant, "bence@example.com", null, ClaimStatus.APPROVED, Instant.now()
        );
        return new Handover(UUID.randomUUID(), claim, "123456", false, null);
    }
}
