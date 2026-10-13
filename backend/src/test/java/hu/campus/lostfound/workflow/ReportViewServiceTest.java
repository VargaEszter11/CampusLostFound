package hu.campus.lostfound.workflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportRepository;
import hu.campus.lostfound.report.ReportResponse;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportViewServiceTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ReportService reportService;
    @Mock
    private HandoverRepository handoverRepository;
    @Mock
    private AuthSupport authSupport;

    private ReportViewService reportViewService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    private final User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());
    private final User stranger = new User(UUID.randomUUID(), "Csenge Nagy", "csenge@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        reportViewService = new ReportViewService(
                reportRepository, reportService, handoverRepository, authSupport, new ReportAccess()
        );
    }

    @Test
    void reporterAlwaysSeesOwnContact() {
        Report report = openReport();
        when(authSupport.requireUserId()).thenReturn(reporter.getId());
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(handoverRepository.findByParticipantId(reporter.getId())).thenReturn(List.of());

        ReportResponse response = reportViewService.get(report.getId());

        assertThat(response.reporterContact()).isEqualTo("anna@example.com");
    }

    @Test
    void strangerCannotSeeContactBeforeApproval() {
        Report report = openReport();
        when(authSupport.requireUserId()).thenReturn(stranger.getId());
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(handoverRepository.findByParticipantId(stranger.getId())).thenReturn(List.of());

        ReportResponse response = reportViewService.get(report.getId());

        assertThat(response.reporterContact()).isNull();
    }

    @Test
    void handoverParticipantSeesContactAfterApproval() {
        Report report = openReport();
        Claim claim = new Claim(
                UUID.randomUUID(), report, claimant, "bence@example.com", null, ClaimStatus.APPROVED, Instant.now()
        );
        Handover handover = new Handover(UUID.randomUUID(), claim, "123456", false, null);
        when(authSupport.requireUserId()).thenReturn(claimant.getId());
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(handoverRepository.findByParticipantId(claimant.getId())).thenReturn(List.of(handover));

        ReportResponse response = reportViewService.get(report.getId());

        assertThat(response.reporterContact()).isEqualTo("anna@example.com");
    }

    @Test
    void listHidesContactOnlyForNonParticipants() {
        Report ownReport = openReport();
        Report othersReport = reportBy(stranger);
        when(authSupport.requireUserId()).thenReturn(reporter.getId());
        when(reportRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(ownReport, othersReport));
        when(handoverRepository.findByParticipantId(reporter.getId())).thenReturn(List.of());

        List<ReportResponse> result = reportViewService.list(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).reporterContact()).isEqualTo("anna@example.com");
        assertThat(result.get(1).reporterContact()).isNull();
    }

    private Report openReport() {
        return reportBy(reporter);
    }

    private Report reportBy(User owner) {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(), item, owner, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), owner.getEmail(), Instant.now()
        );
    }
}
