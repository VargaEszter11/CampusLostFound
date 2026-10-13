package hu.campus.lostfound.handover;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimStatus;
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
class HandoverServiceTest {

    @Mock
    private HandoverRepository handoverRepository;
    @Mock
    private AuthSupport authSupport;
    @Mock
    private NotificationService notificationService;

    private HandoverService handoverService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    private final User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        handoverService = new HandoverService(handoverRepository, authSupport, notificationService, new ReportAccess());
    }

    @Test
    void confirmByReporterClosesReportAndNotifiesClaimant() {
        Report report = openReport();
        Handover handover = approvedHandover(report);
        when(handoverRepository.findById(handover.getId())).thenReturn(Optional.of(handover));
        when(authSupport.requireUser()).thenReturn(reporter);

        HandoverResponse response = handoverService.confirm(handover.getId());

        assertThat(response.confirmed()).isTrue();
        assertThat(report.getStatus()).isEqualTo(ReportStatus.CLOSED);
        verify(notificationService).notify(eq(claimant), any(), any(), any(), any(), any(), any());
    }

    @Test
    void confirmByClaimantNotifiesReporter() {
        Report report = openReport();
        Handover handover = approvedHandover(report);
        when(handoverRepository.findById(handover.getId())).thenReturn(Optional.of(handover));
        when(authSupport.requireUser()).thenReturn(claimant);

        handoverService.confirm(handover.getId());

        verify(notificationService).notify(eq(reporter), any(), any(), any(), any(), any(), any());
    }

    @Test
    void confirmByStrangerIsForbidden() {
        Report report = openReport();
        Handover handover = approvedHandover(report);
        when(handoverRepository.findById(handover.getId())).thenReturn(Optional.of(handover));
        when(authSupport.requireUser())
                .thenReturn(new User(UUID.randomUUID(), "Csenge Nagy", "csenge@example.com", Instant.now()));

        assertThatThrownBy(() -> handoverService.confirm(handover.getId())).isInstanceOf(ForbiddenException.class);
        assertThat(report.getStatus()).isEqualTo(ReportStatus.OPEN);
    }

    @Test
    void confirmAlreadyConfirmedThrows() {
        Report report = openReport();
        Handover handover = approvedHandover(report);
        handover.confirm(Instant.now());
        when(handoverRepository.findById(handover.getId())).thenReturn(Optional.of(handover));
        when(authSupport.requireUser()).thenReturn(reporter);

        assertThatThrownBy(() -> handoverService.confirm(handover.getId())).isInstanceOf(BadRequestException.class);
    }

    @Test
    void confirmUnknownHandoverThrowsNotFound() {
        UUID id = UUID.randomUUID();
        when(handoverRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> handoverService.confirm(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void listForCurrentUserMarksRoleCorrectly() {
        Report report = openReport();
        Handover handover = approvedHandover(report);
        when(authSupport.requireUser()).thenReturn(reporter);
        when(handoverRepository.findByParticipantId(reporter.getId())).thenReturn(List.of(handover));

        List<HandoverListItemResponse> result = handoverService.listForCurrentUser();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).yourRole()).isEqualTo("REPORTER");
    }

    private Report openReport() {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
    }

    private Handover approvedHandover(Report report) {
        Claim claim = new Claim(
                UUID.randomUUID(), report, claimant, "bence@example.com", null, ClaimStatus.APPROVED, Instant.now()
        );
        return new Handover(UUID.randomUUID(), claim, "123456", false, null);
    }
}
