package hu.campus.lostfound.workflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimRepository;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.handover.HandoverResponse;
import hu.campus.lostfound.notification.NotificationService;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
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
class ApprovalServiceTest {

    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private HandoverRepository handoverRepository;
    @Mock
    private AuthSupport authSupport;
    @Mock
    private NotificationService notificationService;

    private ApprovalService approvalService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    private final User claimantA = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());
    private final User claimantB = new User(UUID.randomUUID(), "Csenge Nagy", "csenge@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        approvalService = new ApprovalService(
                claimRepository, handoverRepository, authSupport, notificationService, new ReportAccess()
        );
    }

    @Test
    void approveCreatesHandoverRejectsOtherPendingClaimsAndNotifiesBoth() {
        Report report = openReport();
        Claim toApprove = pendingClaim(report, claimantA);
        Claim other = pendingClaim(report, claimantB);
        when(claimRepository.findById(toApprove.getId())).thenReturn(Optional.of(toApprove));
        when(authSupport.requireUser()).thenReturn(reporter);
        when(handoverRepository.findApprovedForReport(report.getId())).thenReturn(Optional.empty());
        when(claimRepository.findByReportIdOrderByCreatedAtAsc(report.getId()))
                .thenReturn(List.of(toApprove, other));
        when(handoverRepository.findByHandoverCode(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty());

        HandoverResponse response = approvalService.approve(toApprove.getId());

        assertThat(toApprove.getStatus()).isEqualTo(ClaimStatus.APPROVED);
        assertThat(other.getStatus()).isEqualTo(ClaimStatus.REJECTED);
        assertThat(response.handoverCode()).hasSize(6);
        verify(notificationService).notify(eq(claimantA), any(), any(), any(), any(), any(), any());
        verify(notificationService).notify(eq(claimantB), any(), any(), any(), any(), any(), any());
        verify(notificationService, times(2)).notify(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void approveByNonOwnerIsForbidden() {
        Report report = openReport();
        Claim claim = pendingClaim(report, claimantA);
        when(claimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(authSupport.requireUser()).thenReturn(claimantA);

        assertThatThrownBy(() -> approvalService.approve(claim.getId())).isInstanceOf(ForbiddenException.class);
        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.PENDING);
    }

    @Test
    void approveRejectsWhenReportNotOpen() {
        Report report = openReport();
        report.close();
        Claim claim = pendingClaim(report, claimantA);
        when(claimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(authSupport.requireUser()).thenReturn(reporter);

        assertThatThrownBy(() -> approvalService.approve(claim.getId())).isInstanceOf(BadRequestException.class);
    }

    @Test
    void approveRejectsWhenReportAlreadyHasApprovedClaim() {
        Report report = openReport();
        Claim claim = pendingClaim(report, claimantA);
        when(claimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(authSupport.requireUser()).thenReturn(reporter);
        when(handoverRepository.findApprovedForReport(report.getId()))
                .thenReturn(Optional.of(new Handover(UUID.randomUUID(), claim, "999999", false, null)));

        assertThatThrownBy(() -> approvalService.approve(claim.getId())).isInstanceOf(BadRequestException.class);
    }

    @Test
    void approveUnknownClaimThrowsNotFound() {
        UUID id = UUID.randomUUID();
        when(claimRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> approvalService.approve(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void approveAlreadyResolvedClaimThrows() {
        Report report = openReport();
        Claim claim = pendingClaim(report, claimantA);
        claim.reject();
        when(claimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(authSupport.requireUser()).thenReturn(reporter);
        when(handoverRepository.findApprovedForReport(report.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> approvalService.approve(claim.getId())).isInstanceOf(BadRequestException.class);
    }

    private Report openReport() {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
    }

    private Claim pendingClaim(Report report, User claimant) {
        return new Claim(
                UUID.randomUUID(), report, claimant, claimant.getEmail(), null, ClaimStatus.PENDING, Instant.now()
        );
    }
}
