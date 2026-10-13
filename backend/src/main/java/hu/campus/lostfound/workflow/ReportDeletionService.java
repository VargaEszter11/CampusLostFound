package hu.campus.lostfound.workflow;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.claim.ClaimRepository;
import hu.campus.lostfound.claim.ClaimStatus;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.ItemRepository;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportAccess;
import hu.campus.lostfound.report.ReportRepository;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.user.User;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportDeletionService {

    private final ReportService reportService;
    private final ReportRepository reportRepository;
    private final ItemRepository itemRepository;
    private final ClaimRepository claimRepository;
    private final AuthSupport authSupport;
    private final ReportAccess reportAccess;

    public ReportDeletionService(
            ReportService reportService,
            ReportRepository reportRepository,
            ItemRepository itemRepository,
            ClaimRepository claimRepository,
            AuthSupport authSupport,
            ReportAccess reportAccess
    ) {
        this.reportService = reportService;
        this.reportRepository = reportRepository;
        this.itemRepository = itemRepository;
        this.claimRepository = claimRepository;
        this.authSupport = authSupport;
        this.reportAccess = reportAccess;
    }

    @Transactional
    public void delete(UUID reportId) {
        Report report = reportService.requireReport(reportId);
        User current = authSupport.requireUser();
        reportAccess.requireReporter(report, current, "delete this report");

        if (claimRepository.existsByReport_IdAndStatus(reportId, ClaimStatus.APPROVED)) {
            throw new BadRequestException("Cannot delete a report with an approved claim");
        }

        claimRepository.deleteByReport_Id(reportId);
        Item item = report.getItem();
        reportRepository.delete(report);
        itemRepository.delete(item);
    }
}
