package hu.campus.lostfound.auth;

public record GoogleIdentity(
        String subject,
        String email,
        String displayName
) {
}
