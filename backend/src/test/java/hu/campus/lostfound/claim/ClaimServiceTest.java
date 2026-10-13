package hu.campus.lostfound.claim;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.notification.NotificationService;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private ReportService reportService;
    @Mock
    private UserService userService;
    @Mock
    private AuthSupport authSupport;
    @Mock
    private NotificationService notificationService;

    private ClaimService claimService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    private final User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        claimService = new ClaimService(
                claimRepository, reportService, userService, authSupport, notificationService, new ReportAccess()
        );
    }

    @Test
    void createSavesPendingClaimAndNotifiesReporter() {
        Report report = openReport();
        when(authSupport.requireUser()).thenReturn(claimant);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(claimRepository.existsByReport_IdAndStatus(report.getId(), ClaimStatus.APPROVED)).thenReturn(false);
        CreateClaimRequest request = new CreateClaimRequest(report.getId(), " bence@example.com ", " my id is inside ");

        ClaimResponse response = claimService.create(request);

        verify(userService).validateContact(" bence@example.com ");
        verify(claimRepository).save(any(Claim.class));
        verify(notificationService).notify(
                org.mockito.ArgumentMatchers.eq(reporter), any(), any(), any(), any(), any(), any()
        );
        assertThat(response.status()).isEqualTo(ClaimStatus.PENDING);
        assertThat(response.claimantContact()).isEqualTo("bence@example.com");
    }

    @Test
    void createRejectsWhenReportNotOpen() {
        Report report = openReport();
        report.close();
        when(authSupport.requireUser()).thenReturn(claimant);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        CreateClaimRequest request = new CreateClaimRequest(report.getId(), "bence@example.com", null);

        assertThatThrownBy(() -> claimService.create(request)).isInstanceOf(BadRequestException.class);
        verify(claimRepository, never()).save(any());
    }

    @Test
    void createRejectsWhenReportAlreadyHasApprovedClaim() {
        Report report = openReport();
        when(authSupport.requireUser()).thenReturn(claimant);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(claimRepository.existsByReport_IdAndStatus(report.getId(), ClaimStatus.APPROVED)).thenReturn(true);
        CreateClaimRequest request = new CreateClaimRequest(report.getId(), "bence@example.com", null);

        assertThatThrownBy(() -> claimService.create(request)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void createRejectsClaimingOwnReport() {
        Report report = openReport();
        when(authSupport.requireUser()).thenReturn(reporter);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(claimRepository.existsByReport_IdAndStatus(report.getId(), ClaimStatus.APPROVED)).thenReturn(false);
        CreateClaimRequest request = new CreateClaimRequest(report.getId(), "anna@example.com", null);

        assertThatThrownBy(() -> claimService.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You cannot claim your own report");
    }

    @Test
    void rejectByOwnerRejectsClaimAndNotifiesClaimant() {
        Report report = openReport();
        Claim claim = pendingClaim(report);
        when(claimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(authSupport.requireUser()).thenReturn(reporter);

        ClaimResponse response = claimService.reject(claim.getId());

        assertThat(response.status()).isEqualTo(ClaimStatus.REJECTED);
        verify(notificationService).notify(
                org.mockito.ArgumentMatchers.eq(claimant), any(), any(), any(), any(), any(), any()
        );
    }

    @Test
    void rejectByNonOwnerIsForbidden() {
        Report report = openReport();
        Claim claim = pendingClaim(report);
        when(claimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(authSupport.requireUser()).thenReturn(claimant);

        assertThatThrownBy(() -> claimService.reject(claim.getId())).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void rejectUnknownClaimThrowsNotFound() {
        UUID id = UUID.randomUUID();
        when(claimRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> claimService.reject(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void listForReportByOwnerReturnsClaims() {
        Report report = openReport();
        Claim claim = pendingClaim(report);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(reporter);
        when(claimRepository.findByReportIdOrderByCreatedAtAsc(report.getId())).thenReturn(List.of(claim));

        List<ClaimResponse> result = claimService.listForReport(report.getId());

        assertThat(result).hasSize(1);
    }

    @Test
    void listForReportByNonOwnerIsForbidden() {
        Report report = openReport();
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(claimant);

        assertThatThrownBy(() -> claimService.listForReport(report.getId())).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void listForCurrentUserReturnsOwnClaims() {
        Report report = openReport();
        Claim claim = pendingClaim(report);
        when(authSupport.requireUserId()).thenReturn(claimant.getId());
        when(claimRepository.findByClaimant_IdOrderByCreatedAtDesc(claimant.getId())).thenReturn(List.of(claim));

        assertThat(claimService.listForCurrentUser()).hasSize(1);
    }

    private Report openReport() {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
    }

    private Claim pendingClaim(Report report) {
        return new Claim(
                UUID.randomUUID(), report, claimant, "bence@example.com", null, ClaimStatus.PENDING, Instant.now()
        );
    }
}
