package hu.campus.lostfound.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import hu.campus.lostfound.shared.BadRequestException;
import org.junit.jupiter.api.Test;

/**
 * Only covers configuration checks and the fast-fail path. Does not call the real Google API.
 */
class GoogleTokenServiceTest {

    @Test
    void isConfiguredTrueWhenClientIdPresent() {
        GoogleTokenService service = new GoogleTokenService("client-id.apps.googleusercontent.com");

        assertThat(service.isConfigured()).isTrue();
    }

    @Test
    void isConfiguredFalseWhenClientIdBlank() {
        GoogleTokenService service = new GoogleTokenService("  ");

        assertThat(service.isConfigured()).isFalse();
    }

    @Test
    void verifyFailsFastWhenNotConfiguredWithoutCallingTheApi() {
        GoogleTokenService service = new GoogleTokenService("");

        assertThatThrownBy(() -> service.verify("some-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Google Sign-In is not configured on the server");
    }
}
