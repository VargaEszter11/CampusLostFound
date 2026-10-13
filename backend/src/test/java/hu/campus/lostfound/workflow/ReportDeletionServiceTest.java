package hu.campus.lostfound.workflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.ClaimRepository;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.ItemRepository;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportRepository;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.report.ReportType;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportDeletionServiceTest {

    @Mock
    private ReportService reportService;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private AuthSupport authSupport;

    private ReportDeletionService reportDeletionService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        reportDeletionService = new ReportDeletionService(
                reportService, reportRepository, itemRepository, claimRepository, authSupport, new ReportAccess()
        );
    }

    @Test
    void ownerDeletesReportClaimsAndItem() {
        Report report = report(reporter);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(reporter);
        when(claimRepository.existsByReport_IdAndStatus(report.getId(), ClaimStatus.APPROVED)).thenReturn(false);

        reportDeletionService.delete(report.getId());

        verify(claimRepository).deleteByReport_Id(report.getId());
        verify(reportRepository).delete(report);
        verify(itemRepository).delete(report.getItem());
    }

    @Test
    void nonOwnerCannotDelete() {
        Report report = report(reporter);
        User other = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(other);

        assertThatThrownBy(() -> reportDeletionService.delete(report.getId())).isInstanceOf(ForbiddenException.class);
        verify(reportRepository, never()).delete(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void reportWithApprovedClaimCannotBeDeleted() {
        Report report = report(reporter);
        when(reportService.requireReport(report.getId())).thenReturn(report);
        when(authSupport.requireUser()).thenReturn(reporter);
        when(claimRepository.existsByReport_IdAndStatus(report.getId(), ClaimStatus.APPROVED)).thenReturn(true);

        assertThatThrownBy(() -> reportDeletionService.delete(report.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cannot delete a report with an approved claim");
        verify(claimRepository, never()).deleteByReport_Id(org.mockito.ArgumentMatchers.any());
        verify(reportRepository, never()).delete(org.mockito.ArgumentMatchers.any());
    }

    private static Report report(User owner) {
        Item item = new Item(UUID.randomUUID(), "Black wallet", null, "Other");
        return new Report(
                UUID.randomUUID(), item, owner, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), owner.getEmail(), Instant.now()
        );
    }
}
