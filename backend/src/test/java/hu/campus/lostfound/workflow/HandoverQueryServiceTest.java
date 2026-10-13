package hu.campus.lostfound.workflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.handover.HandoverResponse;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HandoverQueryServiceTest {

    @Mock
    private HandoverRepository handoverRepository;
    @Mock
    private ReportService reportService;
    @Mock
    private AuthSupport authSupport;

    private HandoverQueryService handoverQueryService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    private final User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());
    private final User stranger = new User(UUID.randomUUID(), "Csenge Nagy", "csenge@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        handoverQueryService = new HandoverQueryService(handoverRepository, reportService, authSupport, new ReportAccess());
    }

    @Test
    void returnsEmptyWhenNoApprovedClaim() {
        Report report = report();
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(reporter);
        when(handoverRepository.findApprovedForReport(report.getId())).thenReturn(Optional.empty());

        assertThat(handoverQueryService.findHandoverForReport(report.getId())).isEmpty();
    }

    @Test
    void reporterCanViewHandover() {
        Report report = report();
        Handover handover = handoverFor(report);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(reporter);
        when(handoverRepository.findApprovedForReport(report.getId())).thenReturn(Optional.of(handover));

        Optional<HandoverResponse> result = handoverQueryService.findHandoverForReport(report.getId());

        assertThat(result).isPresent();
    }

    @Test
    void claimantCanViewHandover() {
        Report report = report();
        Handover handover = handoverFor(report);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(claimant);
        when(handoverRepository.findApprovedForReport(report.getId())).thenReturn(Optional.of(handover));

        assertThat(handoverQueryService.findHandoverForReport(report.getId())).isPresent();
    }

    @Test
    void strangerCannotViewHandover() {
        Report report = report();
        Handover handover = handoverFor(report);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(stranger);
        when(handoverRepository.findApprovedForReport(report.getId())).thenReturn(Optional.of(handover));

        assertThatThrownBy(() -> handoverQueryService.findHandoverForReport(report.getId()))
                .isInstanceOf(ForbiddenException.class);
    }

    private Report report() {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
    }

    private Handover handoverFor(Report report) {
        Claim claim = new Claim(
                UUID.randomUUID(), report, claimant, "bence@example.com", null, ClaimStatus.APPROVED, Instant.now()
        );
        return new Handover(UUID.randomUUID(), claim, "123456", false, null);
    }
}
