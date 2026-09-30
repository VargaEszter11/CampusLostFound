package hu.campus.lostfound.notification;

import hu.campus.lostfound.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "report_id")
    private UUID reportId;

    @Column(name = "claim_id")
    private UUID claimId;

    @Column(name = "handover_id")
    private UUID handoverId;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Notification() {
    }

    public Notification(
            UUID id,
            User user,
            NotificationType type,
            String title,
            String body,
            UUID reportId,
            UUID claimId,
            UUID handoverId,
            Instant createdAt
    ) {
        this.id = id;
        this.user = user;
        this.type = type;
        this.title = title;
        this.body = body;
        this.reportId = reportId;
        this.claimId = claimId;
        this.handoverId = handoverId;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public UUID getReportId() {
        return reportId;
    }

    public UUID getClaimId() {
        return claimId;
    }

    public UUID getHandoverId() {
        return handoverId;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isRead() {
        return readAt != null;
    }

    public void markRead(Instant at) {
        if (this.readAt == null) {
            this.readAt = at;
        }
    }
}
