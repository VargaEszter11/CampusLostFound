package hu.campus.lostfound.auth;

import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserRepository;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthSupport {

    private final UserRepository userRepository;

    public AuthSupport(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthUser requirePrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUser authUser)) {
            throw new ForbiddenException("Authentication required");
        }
        return authUser;
    }

    public UUID requireUserId() {
        return requirePrincipal().getId();
    }

    public User requireUser() {
        UUID id = requireUserId();
        return userRepository.findById(id)
                .orElseThrow(() -> new ForbiddenException("Authenticated user no longer exists"));
    }
}
