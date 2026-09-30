package hu.campus.lostfound.notification;

import java.util.List;

public record NotificationListResponse(
        List<NotificationResponse> items,
        long unreadCount
) {
}
