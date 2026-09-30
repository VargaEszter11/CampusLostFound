package hu.campus.lostfound.user;

import hu.campus.lostfound.user.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByDisplayNameIgnoreCase(String displayName);

    Optional<User> findByGoogleSub(String googleSub);
}
