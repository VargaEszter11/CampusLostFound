package hu.campus.lostfound.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.GoogleIdentity;
import hu.campus.lostfound.auth.GoogleTokenService;
import hu.campus.lostfound.shared.BadRequestException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private GoogleTokenService googleTokenService;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder, googleTokenService);
    }

    @Test
    void validateContactAcceptsValidEmail() {
        userService.validateContact("anna@example.com");
    }

    @Test
    void validateContactAcceptsValidPhone() {
        userService.validateContact("+36 30 123 4567");
    }

    @Test
    void validateContactRejectsBlank() {
        assertThatThrownBy(() -> userService.validateContact("  "))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Contact is required");
    }

    @Test
    void validateContactRejectsGarbage() {
        assertThatThrownBy(() -> userService.validateContact("not-a-contact"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void registerCreatesUserWithEncodedPassword() {
        when(userRepository.findByEmailIgnoreCase("anna@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret1")).thenReturn("hashed");
        when(userRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        User user = userService.register("Anna Kiss", " Anna@Example.com ", "secret1");

        assertThat(user.getEmail()).isEqualTo("anna@example.com");
        assertThat(user.getPasswordHash()).isEqualTo("hashed");
    }

    @Test
    void registerRejectsBlankName() {
        assertThatThrownBy(() -> userService.register("  ", "anna@example.com", "secret1"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void registerRejectsInvalidEmail() {
        assertThatThrownBy(() -> userService.register("Anna Kiss", "not-an-email", "secret1"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void registerRejectsShortPassword() {
        assertThatThrownBy(() -> userService.register("Anna Kiss", "anna@example.com", "short"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.findByEmailIgnoreCase("anna@example.com"))
                .thenReturn(Optional.of(new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now())));

        assertThatThrownBy(() -> userService.register("Anna Kiss", "anna@example.com", "secret1"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void authenticateSucceedsWithMatchingPassword() {
        User user = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        user.assignPassword("hashed");
        when(userRepository.findByEmailIgnoreCase("anna@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret1", "hashed")).thenReturn(true);

        assertThat(userService.authenticate("anna@example.com", "secret1")).isSameAs(user);
    }

    @Test
    void authenticateRejectsWrongPassword() {
        User user = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        user.assignPassword("hashed");
        when(userRepository.findByEmailIgnoreCase("anna@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> userService.authenticate("anna@example.com", "wrong"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void authenticateRejectsUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.authenticate("nobody@example.com", "secret1"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void authenticateRejectsGoogleOnlyAccount() {
        User user = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        when(userRepository.findByEmailIgnoreCase("anna@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.authenticate("anna@example.com", "secret1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Google Sign-In");
    }

    @Test
    void loginWithGoogleReturnsExistingUserBySubject() {
        User existing = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
        existing.linkGoogleAccount("sub-1");
        when(googleTokenService.verify("token")).thenReturn(new GoogleIdentity("sub-1", "anna@example.com", "Anna Kiss"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.of(existing));

        User result = userService.loginWithGoogle("token");

        assertThat(result).isSameAs(existing);
    }

    @Test
    void loginWithGoogleLinksExistingAccountByEmail() {
        User existing = new User(UUID.randomUUID(), "", "anna@example.com", Instant.now());
        when(googleTokenService.verify("token")).thenReturn(new GoogleIdentity("sub-1", "anna@example.com", "Anna Kiss"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("anna@example.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);

        User result = userService.loginWithGoogle("token");

        assertThat(result.getGoogleSub()).isEqualTo("sub-1");
        assertThat(result.getDisplayName()).isEqualTo("Anna Kiss");
    }

    @Test
    void loginWithGoogleCreatesNewUserWhenNoneExists() {
        when(googleTokenService.verify("token"))
                .thenReturn(new GoogleIdentity("sub-1", "new@example.com", "New Person"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.loginWithGoogle("token");

        assertThat(result.getEmail()).isEqualTo("new@example.com");
        assertThat(result.getDisplayName()).isEqualTo("New Person");
        assertThat(result.getGoogleSub()).isEqualTo("sub-1");
    }
}
