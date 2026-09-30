package hu.campus.lostfound.user;

import hu.campus.lostfound.auth.GoogleIdentity;
import hu.campus.lostfound.auth.GoogleTokenService;
import hu.campus.lostfound.shared.BadRequestException;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Pattern EMAIL =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE =
            Pattern.compile("^\\+?[0-9()\\-\\s]{7,20}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenService googleTokenService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            GoogleTokenService googleTokenService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.googleTokenService = googleTokenService;
    }

    public void validateContact(String contact) {
        String trimmed = contact == null ? "" : contact.trim();
        if (trimmed.isEmpty()) {
            throw new BadRequestException("Contact is required");
        }
        if (EMAIL.matcher(trimmed).matches()) {
            return;
        }
        long digits = trimmed.chars().filter(Character::isDigit).count();
        if (digits >= 7 && PHONE.matcher(trimmed).matches()) {
            return;
        }
        throw new BadRequestException("Enter a valid email address or phone number");
    }

    @Transactional
    public User register(String displayName, String email, String password) {
        String name = displayName == null ? "" : displayName.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (name.isEmpty()) {
            throw new BadRequestException("Display name is required");
        }
        if (!EMAIL.matcher(normalizedEmail).matches()) {
            throw new BadRequestException("Enter a valid email address");
        }
        if (password == null || password.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = new User(UUID.randomUUID(), name, normalizedEmail, Instant.now());
        user.setPasswordHash(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User authenticate(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (user.getPasswordHash() == null) {
            throw new BadRequestException("This account uses Google Sign-In. Continue with Google.");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }
        return user;
    }

    @Transactional
    public User loginWithGoogle(String idToken) {
        GoogleIdentity identity = googleTokenService.verify(idToken);
        String normalizedEmail = identity.email().trim().toLowerCase(Locale.ROOT);
        String subject = identity.subject();

        Optional<User> bySub = userRepository.findByGoogleSub(subject);
        if (bySub.isPresent()) {
            return bySub.get();
        }

        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (byEmail.isPresent()) {
            User existing = byEmail.get();
            if (existing.getGoogleSub() != null && !existing.getGoogleSub().equals(subject)) {
                throw new BadRequestException("This email is linked to a different Google account");
            }
            existing.setGoogleSub(subject);
            if (existing.getDisplayName() == null || existing.getDisplayName().isBlank()) {
                existing.setDisplayName(identity.displayName().trim());
            }
            return userRepository.save(existing);
        }

        String name = identity.displayName() == null ? "" : identity.displayName().trim();
        if (name.isEmpty()) {
            name = normalizedEmail;
        }
        User user = new User(UUID.randomUUID(), name, normalizedEmail, Instant.now());
        user.setGoogleSub(subject);
        return userRepository.save(user);
    }
}
