package hu.campus.lostfound.notification;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthSupport authSupport;

    public NotificationService(NotificationRepository notificationRepository, AuthSupport authSupport) {
        this.notificationRepository = notificationRepository;
        this.authSupport = authSupport;
    }

    @Transactional
    public void notify(
            User recipient,
            NotificationType type,
            String title,
            String body,
            UUID reportId,
            UUID claimId,
            UUID handoverId
    ) {
        if (recipient == null) {
            return;
        }
        notificationRepository.save(new Notification(
                UUID.randomUUID(),
                recipient,
                type,
                title,
                body,
                reportId,
                claimId,
                handoverId,
                Instant.now()
        ));
    }

    @Transactional(readOnly = true)
    public NotificationListResponse listForCurrentUser() {
        UUID userId = authSupport.requireUserId();
        List<NotificationResponse> items = notificationRepository
                .findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
        long unread = notificationRepository.countByUser_IdAndReadAtIsNull(userId);
        return new NotificationListResponse(items, unread);
    }

    @Transactional
    public NotificationResponse markRead(UUID notificationId) {
        UUID userId = authSupport.requireUserId();
        Notification notification = notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + notificationId));
        notification.markRead(Instant.now());
        return NotificationResponse.from(notification);
    }

    @Transactional
    public NotificationListResponse markAllRead() {
        UUID userId = authSupport.requireUserId();
        notificationRepository.markAllReadForUser(userId, Instant.now());
        return listForCurrentUser();
    }
}
