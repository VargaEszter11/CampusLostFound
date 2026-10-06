package hu.campus.lostfound.workflow;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.handover.Handover;
import hu.campus.lostfound.handover.HandoverMapper;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.handover.HandoverResponse;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.user.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HandoverQueryService {

    private final HandoverRepository handoverRepository;
    private final ReportService reportService;
    private final AuthSupport authSupport;
    private final ReportAccess reportAccess;

    public HandoverQueryService(
            HandoverRepository handoverRepository,
            ReportService reportService,
            AuthSupport authSupport,
            ReportAccess reportAccess
    ) {
        this.handoverRepository = handoverRepository;
        this.reportService = reportService;
        this.authSupport = authSupport;
        this.reportAccess = reportAccess;
    }

    @Transactional(readOnly = true)
    public Optional<HandoverResponse> findHandoverForReport(UUID reportId) {
        Report report = reportService.requireReport(reportId);
        User current = authSupport.requireUser();
        Optional<Handover> handover = handoverRepository.findApprovedForReport(reportId);
        if (handover.isEmpty()) {
            return Optional.empty();
        }
        assertCanViewHandover(report, handover.get(), current);
        return handover.map(HandoverMapper::toResponse);
    }

    private void assertCanViewHandover(Report report, Handover handover, User current) {
        UUID currentId = current.getId();
        boolean isReporter = reportAccess.isReporter(report, currentId);
        boolean isClaimant = handover.getClaim().getClaimant().getId().equals(currentId);
        if (!isReporter && !isClaimant) {
            throw new ForbiddenException("You cannot view this handover");
        }
    }
}
