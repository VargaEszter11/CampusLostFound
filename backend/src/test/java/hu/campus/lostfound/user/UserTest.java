package hu.campus.lostfound.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import hu.campus.lostfound.shared.BadRequestException;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UserTest {

    @Test
    void assignPasswordSetsHash() {
        User user = newUser();

        user.assignPassword("hashed");

        assertThat(user.getPasswordHash()).isEqualTo("hashed");
    }

    @Test
    void linkGoogleAccountFirstTimeSucceeds() {
        User user = newUser();

        user.linkGoogleAccount("sub-1");

        assertThat(user.getGoogleSub()).isEqualTo("sub-1");
    }

    @Test
    void linkGoogleAccountSameSubjectAgainSucceeds() {
        User user = newUser();
        user.linkGoogleAccount("sub-1");

        user.linkGoogleAccount("sub-1");

        assertThat(user.getGoogleSub()).isEqualTo("sub-1");
    }

    @Test
    void linkGoogleAccountDifferentSubjectThrows() {
        User user = newUser();
        user.linkGoogleAccount("sub-1");

        assertThatThrownBy(() -> user.linkGoogleAccount("sub-2"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("This email is linked to a different Google account");
        assertThat(user.getGoogleSub()).isEqualTo("sub-1");
    }

    @Test
    void adoptDisplayNameIfBlankAdoptsWhenCurrentIsBlank() {
        User user = new User(UUID.randomUUID(), "  ", "anna@example.com", Instant.now());

        user.adoptDisplayNameIfBlank(" Anna Kiss ");

        assertThat(user.getDisplayName()).isEqualTo("Anna Kiss");
    }

    @Test
    void adoptDisplayNameIfBlankKeepsExistingNonBlankName() {
        User user = newUser();

        user.adoptDisplayNameIfBlank("Someone Else");

        assertThat(user.getDisplayName()).isEqualTo("Anna Kiss");
    }

    @Test
    void adoptDisplayNameIfBlankIgnoresBlankCandidate() {
        User user = new User(UUID.randomUUID(), "", "anna@example.com", Instant.now());

        user.adoptDisplayNameIfBlank("   ");

        assertThat(user.getDisplayName()).isEmpty();
    }

    private static User newUser() {
        return new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    }
}
