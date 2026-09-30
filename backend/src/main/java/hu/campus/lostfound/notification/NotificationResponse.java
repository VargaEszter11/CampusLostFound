package hu.campus.lostfound.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String body,
        UUID reportId,
        UUID claimId,
        UUID handoverId,
        boolean read,
        Instant createdAt
) {
    static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getBody(),
                n.getReportId(),
                n.getClaimId(),
                n.getHandoverId(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
