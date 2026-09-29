package hu.campus.lostfound.user;

import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserRepository;
import hu.campus.lostfound.shared.BadRequestException;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Pattern EMAIL =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE =
            Pattern.compile("^\\+?[0-9()\\-\\s]{7,20}$");

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
    public User resolveOrCreate(String displayName, String contact) {
        String name = displayName.trim();
        String trimmedContact = contact.trim();

        if (EMAIL.matcher(trimmedContact).matches()) {
            return userRepository.findByEmailIgnoreCase(trimmedContact)
                    .orElseGet(() -> userRepository.findByDisplayNameIgnoreCase(name)
                            .orElseGet(() -> userRepository.save(
                                    new User(
                                            UUID.randomUUID(),
                                            name,
                                            trimmedContact.toLowerCase(Locale.ROOT),
                                            Instant.now()
                                    )
                            )));
        }

        return userRepository.findByDisplayNameIgnoreCase(name)
                .orElseGet(() -> userRepository.save(
                        new User(
                                UUID.randomUUID(),
                                name,
                                "user-" + UUID.randomUUID() + "@local.dev",
                                Instant.now()
                        )
                ));
    }
}
