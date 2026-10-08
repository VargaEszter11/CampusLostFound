package hu.campus.lostfound.admin;

import hu.campus.lostfound.claim.Claim;
import hu.campus.lostfound.claim.ClaimRepository;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportMapper;
import hu.campus.lostfound.report.ReportRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminReportService {

    private final ReportRepository reportRepository;
    private final ClaimRepository claimRepository;
    private final HandoverRepository handoverRepository;

    public AdminReportService(
            ReportRepository reportRepository,
            ClaimRepository claimRepository,
            HandoverRepository handoverRepository
    ) {
        this.reportRepository = reportRepository;
        this.claimRepository = claimRepository;
        this.handoverRepository = handoverRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminReportResponse> listAll() {
        Map<UUID, List<Claim>> claimsByReport = claimRepository.findAllBy().stream()
                .collect(Collectors.groupingBy(c -> c.getReport().getId()));
        Map<UUID, Handover> handoverByReport = handoverRepository.findAllBy().stream()
                .collect(Collectors.toMap(h -> h.getClaim().getReport().getId(), Function.identity(), (a, b) -> a));

        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(r -> toResponse(r, claimsByReport.getOrDefault(r.getId(), List.of()), handoverByReport.get(r.getId())))
                .toList();
    }

    private AdminReportResponse toResponse(Report report, List<Claim> claims, Handover handover) {
        int pending = (int) claims.stream().filter(c -> c.getStatus() == ClaimStatus.PENDING).count();
        return new AdminReportResponse(
                report.getId(),
                report.getType(),
                ReportMapper.toItemResponse(report.getItem()),
                report.getLocation(),
                report.getOccurredOn(),
                report.getReporter().getDisplayName(),
                report.getReporter().getEmail(),
                report.getReporterContact(),
                report.getStatus(),
                report.getCreatedAt(),
                claims.size(),
                pending,
                handover == null ? null : toHandoverSummary(handover)
        );
    }

    private AdminReportResponse.HandoverSummary toHandoverSummary(Handover handover) {
        Claim claim = handover.getClaim();
        return new AdminReportResponse.HandoverSummary(
                handover.getId(),
                claim.getClaimant().getDisplayName(),
                claim.getClaimant().getEmail(),
                claim.getClaimantContact(),
                handover.getHandoverCode(),
                handover.isConfirmed(),
                handover.getConfirmedAt()
        );
    }
}
