package hu.campus.lostfound.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
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
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private UserService userService;
    @Mock
    private AuthSupport authSupport;

    private ReportAccess reportAccess;
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportAccess = new ReportAccess();
        reportService = new ReportService(reportRepository, itemRepository, userService, authSupport, reportAccess);
    }

    @Test
    void requireReportReturnsReportWhenFound() {
        Report report = report(user());
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        assertThat(reportService.requireReport(report.getId())).isSameAs(report);
    }

    @Test
    void requireReportThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(reportRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.requireReport(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void createValidatesContactAndSavesItemAndReport() {
        User reporter = user();
        when(authSupport.requireUser()).thenReturn(reporter);
        CreateReportRequest request = new CreateReportRequest(
                ReportType.LOST,
                "Blue backpack",
                "  Navy with laptop sleeve  ",
                "Bag / backpack",
                "  Lecture hall B  ",
                LocalDate.now(),
                "  anna@example.com  "
        );

        ReportResponse response = reportService.create(request);

        verify(userService).validateContact("  anna@example.com  ");
        verify(itemRepository).save(any(Item.class));
        verify(reportRepository).save(any(Report.class));
        assertThat(response.item().name()).isEqualTo("Blue backpack");
        assertThat(response.location()).isEqualTo("Lecture hall B");
        assertThat(response.reporterContact()).isEqualTo("anna@example.com");
        assertThat(response.status()).isEqualTo(ReportStatus.OPEN);
    }

    @Test
    void createRejectsInvalidContactBeforeSaving() {
        doThrow(new BadRequestException("Enter a valid email address or phone number"))
                .when(userService).validateContact("not-a-contact");
        CreateReportRequest request = new CreateReportRequest(
                ReportType.LOST, "Blue backpack", null, null, "Lecture hall B", LocalDate.now(), "not-a-contact"
        );

        assertThatThrownBy(() -> reportService.create(request)).isInstanceOf(BadRequestException.class);

        verifyNoInteractions(itemRepository, reportRepository);
    }

    @Test
    void closeByOwnerClosesReport() {
        User reporter = user();
        Report report = report(reporter);
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        when(authSupport.requireUser()).thenReturn(reporter);

        ReportResponse response = reportService.close(report.getId());

        assertThat(response.status()).isEqualTo(ReportStatus.CLOSED);
        assertThat(report.getStatus()).isEqualTo(ReportStatus.CLOSED);
    }

    @Test
    void closeByNonOwnerIsForbidden() {
        Report report = report(user());
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        when(authSupport.requireUser()).thenReturn(user());

        assertThatThrownBy(() -> reportService.close(report.getId())).isInstanceOf(ForbiddenException.class);
        assertThat(report.getStatus()).isEqualTo(ReportStatus.OPEN);
    }

    private static User user() {
        return new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    }

    private static Report report(User reporter) {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(),
                item,
                reporter,
                ReportType.FOUND,
                ReportStatus.OPEN,
                "Main hall",
                LocalDate.now(),
                "anna@example.com",
                Instant.now()
        );
    }
}
