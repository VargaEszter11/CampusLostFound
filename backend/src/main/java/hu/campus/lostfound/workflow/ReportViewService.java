package hu.campus.lostfound.workflow;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportMapper;
import hu.campus.lostfound.report.ReportRepository;
import hu.campus.lostfound.report.ReportResponse;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportViewService {

    private final ReportRepository reportRepository;
    private final ReportService reportService;
    private final HandoverRepository handoverRepository;
    private final AuthSupport authSupport;
    private final ReportAccess reportAccess;

    public ReportViewService(
            ReportRepository reportRepository,
            ReportService reportService,
            HandoverRepository handoverRepository,
            AuthSupport authSupport,
            ReportAccess reportAccess
    ) {
        this.reportRepository = reportRepository;
        this.reportService = reportService;
        this.handoverRepository = handoverRepository;
        this.authSupport = authSupport;
        this.reportAccess = reportAccess;
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> list(ReportStatus status) {
        UUID viewerId = authSupport.requireUserId();
        Set<UUID> handoverReportIds = handoverReportIds(viewerId);
        List<Report> reports = status == null
                ? reportRepository.findAllByOrderByCreatedAtDesc()
                : reportRepository.findByStatusOrderByCreatedAtDesc(status);
        return reports.stream()
                .map(r -> ReportMapper.toResponse(r, canSeeContact(r, viewerId, handoverReportIds)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReportResponse get(UUID id) {
        UUID viewerId = authSupport.requireUserId();
        Report report = reportService.requireReport(id);
        return ReportMapper.toResponse(report, canSeeContact(report, viewerId, handoverReportIds(viewerId)));
    }

    private Set<UUID> handoverReportIds(UUID viewerId) {
        return handoverRepository.findByParticipantId(viewerId).stream()
                .map(h -> h.getClaim().getReport().getId())
                .collect(Collectors.toSet());
    }

    private boolean canSeeContact(Report report, UUID viewerId, Set<UUID> handoverReportIds) {
        return reportAccess.isReporter(report, viewerId) || handoverReportIds.contains(report.getId());
    }
}
