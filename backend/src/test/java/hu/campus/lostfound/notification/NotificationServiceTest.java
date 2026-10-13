package hu.campus.lostfound.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private AuthSupport authSupport;

    private NotificationService notificationService;

    private final User user = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, authSupport);
    }

    @Test
    void notifySavesNotificationForRecipient() {
        notificationService.notify(
                user, NotificationType.CLAIM_CREATED, "New claim", "body",
                UUID.randomUUID(), UUID.randomUUID(), null
        );

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyWithNullRecipientDoesNothing() {
        notificationService.notify(null, NotificationType.CLAIM_CREATED, "New claim", "body", null, null, null);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markReadMarksOwnedNotification() {
        Notification notification = new Notification(
                UUID.randomUUID(), user, NotificationType.CLAIM_CREATED, "New claim", "body",
                null, null, null, Instant.now()
        );
        when(authSupport.requireUserId()).thenReturn(user.getId());
        when(notificationRepository.findByIdAndUser_Id(notification.getId(), user.getId()))
                .thenReturn(Optional.of(notification));

        NotificationResponse response = notificationService.markRead(notification.getId());

        assertThat(response.read()).isTrue();
    }

    @Test
    void markReadThrowsWhenNotFoundOrNotOwned() {
        UUID id = UUID.randomUUID();
        when(authSupport.requireUserId()).thenReturn(user.getId());
        when(notificationRepository.findByIdAndUser_Id(id, user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteRemovesOwnedNotification() {
        Notification notification = new Notification(
                UUID.randomUUID(), user, NotificationType.CLAIM_CREATED, "New claim", "body",
                null, null, null, Instant.now()
        );
        when(authSupport.requireUserId()).thenReturn(user.getId());
        when(notificationRepository.findByIdAndUser_Id(notification.getId(), user.getId()))
                .thenReturn(Optional.of(notification));

        notificationService.delete(notification.getId());

        verify(notificationRepository).delete(notification);
    }

    @Test
    void deleteThrowsWhenNotFoundOrNotOwned() {
        UUID id = UUID.randomUUID();
        when(authSupport.requireUserId()).thenReturn(user.getId());
        when(notificationRepository.findByIdAndUser_Id(id, user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.delete(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void listForCurrentUserReturnsItemsAndUnreadCount() {
        Notification notification = new Notification(
                UUID.randomUUID(), user, NotificationType.CLAIM_CREATED, "New claim", "body",
                null, null, null, Instant.now()
        );
        when(authSupport.requireUserId()).thenReturn(user.getId());
        when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())).thenReturn(List.of(notification));
        when(notificationRepository.countByUser_IdAndReadAtIsNull(user.getId())).thenReturn(1L);

        NotificationListResponse response = notificationService.listForCurrentUser();

        assertThat(response.items()).hasSize(1);
        assertThat(response.unreadCount()).isEqualTo(1L);
    }

    @Test
    void markAllReadDelegatesToRepositoryThenReturnsList() {
        when(authSupport.requireUserId()).thenReturn(user.getId());
        when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())).thenReturn(List.of());
        when(notificationRepository.countByUser_IdAndReadAtIsNull(user.getId())).thenReturn(0L);

        NotificationListResponse response = notificationService.markAllRead();

        verify(notificationRepository).markAllReadForUser(org.mockito.ArgumentMatchers.eq(user.getId()), any());
        assertThat(response.unreadCount()).isZero();
    }
}
