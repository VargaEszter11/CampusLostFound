package hu.campus.lostfound.claim;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ClaimTest {

    @Test
    void approveFromPendingSucceeds() {
        Claim claim = pendingClaim();

        claim.approve();

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.APPROVED);
    }

    @Test
    void approveFromApprovedThrows() {
        Claim claim = pendingClaim();
        claim.approve();

        assertThatThrownBy(claim::approve)
                .isInstanceOf(BadRequestException.class)
                .hasMessage("This claim was already resolved");
    }

    @Test
    void approveFromRejectedThrows() {
        Claim claim = pendingClaim();
        claim.reject();

        assertThatThrownBy(claim::approve).isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectFromPendingSucceeds() {
        Claim claim = pendingClaim();

        claim.reject();

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.REJECTED);
    }

    @Test
    void rejectFromApprovedThrows() {
        Claim claim = pendingClaim();
        claim.approve();

        assertThatThrownBy(claim::reject).isInstanceOf(BadRequestException.class);
    }

    private static Claim pendingClaim() {
        User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        Report report = new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
        return new Claim(
                UUID.randomUUID(), report, claimant, "bence@example.com", null, ClaimStatus.PENDING, Instant.now()
        );
    }
}
