package hu.campus.lostfound.auth;

import hu.campus.lostfound.admin.AdminAccess;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AdminAccess adminAccess;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository, AdminAccess adminAccess) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.adminAccess = adminAccess;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            if (!token.isEmpty() && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    UUID userId = jwtService.parseUserId(token);
                    userRepository.findById(userId).ifPresent(user -> setAuthentication(request, user));
                } catch (JwtException ignored) {
                    // Leave unauthenticated; SecurityConfig will reject protected routes.
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private void setAuthentication(HttpServletRequest request, User user) {
        AuthUser principal = new AuthUser(user, adminAccess.isAdmin(user.getEmail()));
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
