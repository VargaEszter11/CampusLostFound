package hu.campus.lostfound.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import hu.campus.lostfound.shared.BadRequestException;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "google_sub")
    private String googleSub;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected User() {
    }

    public User(UUID id, String displayName, String email, Instant createdAt) {
        this.id = id;
        this.displayName = displayName;
        this.email = email;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void assignPassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void linkGoogleAccount(String subject) {
        if (googleSub != null && !googleSub.equals(subject)) {
            throw new BadRequestException("This email is linked to a different Google account");
        }
        this.googleSub = subject;
    }

    public void adoptDisplayNameIfBlank(String candidate) {
        if ((displayName == null || displayName.isBlank()) && candidate != null && !candidate.isBlank()) {
            this.displayName = candidate.trim();
        }
    }
}
