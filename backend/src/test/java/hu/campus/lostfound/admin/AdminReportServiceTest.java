package hu.campus.lostfound.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimRepository;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportRepository;
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
class AdminReportServiceTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private HandoverRepository handoverRepository;

    private AdminReportService adminReportService;

    private final User reporter = new User(UUID.randomUUID(), "Anna Kiss", "anna@example.com", Instant.now());
    private final User claimant = new User(UUID.randomUUID(), "Bence Toth", "bence@example.com", Instant.now());

    @BeforeEach
    void setUp() {
        adminReportService = new AdminReportService(reportRepository, claimRepository, handoverRepository);
    }

    @Test
    void mapsClaimCountsAndHandoverForReportWithApprovedClaim() {
        Report withHandover = report("Black wallet");
        Report withoutClaims = report("Blue backpack");
        Claim pending = claim(withHandover, ClaimStatus.PENDING);
        Claim approved = claim(withHandover, ClaimStatus.APPROVED);
        Handover handover = new Handover(UUID.randomUUID(), approved, "123456", true, Instant.now());

        when(reportRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(withHandover, withoutClaims));
        when(claimRepository.findAllBy()).thenReturn(List.of(pending, approved));
        when(handoverRepository.findAllBy()).thenReturn(List.of(handover));

        List<AdminReportResponse> result = adminReportService.listAll();

        AdminReportResponse withHandoverResponse = result.stream()
                .filter(r -> r.id().equals(withHandover.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(withHandoverResponse.claimCount()).isEqualTo(2);
        assertThat(withHandoverResponse.pendingClaimCount()).isEqualTo(1);
        assertThat(withHandoverResponse.handover()).isNotNull();
        assertThat(withHandoverResponse.handover().claimantEmail()).isEqualTo("bence@example.com");
        assertThat(withHandoverResponse.reporterEmail()).isEqualTo("anna@example.com");

        AdminReportResponse withoutClaimsResponse = result.stream()
                .filter(r -> r.id().equals(withoutClaims.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(withoutClaimsResponse.claimCount()).isEqualTo(0);
        assertThat(withoutClaimsResponse.handover()).isNull();
    }

    private Report report(String itemName) {
        Item item = new Item(UUID.randomUUID(), itemName, null, "Other");
        return new Report(
                UUID.randomUUID(), item, reporter, ReportType.FOUND, ReportStatus.OPEN,
                "Main hall", LocalDate.now(), "anna@example.com", Instant.now()
        );
    }

    private Claim claim(Report report, ClaimStatus status) {
        return new Claim(UUID.randomUUID(), report, claimant, "bence@example.com", null, status, Instant.now());
    }
}
