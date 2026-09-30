package hu.campus.lostfound.auth;

import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthSupport authSupport;

    public AuthController(UserService userService, JwtService jwtService, AuthSupport authSupport) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.authSupport = authSupport;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request.displayName(), request.email(), request.password());
        return toResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticate(request.email(), request.password());
        return toResponse(user);
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleLoginRequest request) {
        User user = userService.loginWithGoogle(request.idToken());
        return toResponse(user);
    }

    @GetMapping("/me")
    public AuthResponse me() {
        User user = authSupport.requireUser();
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        AuthUser principal = new AuthUser(user);
        return new AuthResponse(
                jwtService.createToken(principal),
                user.getId(),
                user.getDisplayName(),
                user.getEmail()
        );
    }
}
