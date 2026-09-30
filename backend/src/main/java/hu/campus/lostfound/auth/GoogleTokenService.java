package hu.campus.lostfound.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import hu.campus.lostfound.shared.BadRequestException;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenService {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenService(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
        if (this.clientId.isEmpty()) {
            this.verifier = null;
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(this.clientId))
                    .build();
        }
    }

    public boolean isConfigured() {
        return verifier != null;
    }

    public GoogleIdentity verify(String idToken) {
        if (!isConfigured()) {
            throw new BadRequestException("Google Sign-In is not configured on the server");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Google ID token is required");
        }
        try {
            GoogleIdToken token = verifier.verify(idToken.trim());
            if (token == null) {
                throw new BadRequestException("Invalid Google ID token");
            }
            GoogleIdToken.Payload payload = token.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new BadRequestException("Google email is not verified");
            }
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new BadRequestException("Google account has no email");
            }
            String name = (String) payload.get("name");
            if (name == null || name.isBlank()) {
                name = email;
            }
            return new GoogleIdentity(payload.getSubject(), email, name);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (GeneralSecurityException | IOException | RuntimeException ex) {
            throw new BadRequestException("Could not verify Google ID token");
        }
    }
}
