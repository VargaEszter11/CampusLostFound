package hu.campus.lostfound.report;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final ItemRepository itemRepository;
    private final UserService userService;
    private final AuthSupport authSupport;
    private final ReportAccess reportAccess;

    public ReportService(
            ReportRepository reportRepository,
            ItemRepository itemRepository,
            UserService userService,
            AuthSupport authSupport,
            ReportAccess reportAccess
    ) {
        this.reportRepository = reportRepository;
        this.itemRepository = itemRepository;
        this.userService = userService;
        this.authSupport = authSupport;
        this.reportAccess = reportAccess;
    }

    @Transactional(readOnly = true)
    public Report requireReport(UUID id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Report not found: " + id));
    }

    @Transactional
    public ReportResponse create(CreateReportRequest request) {
        userService.validateContact(request.reporterContact());
        User reporter = authSupport.requireUser();

        Item item = new Item(
                UUID.randomUUID(),
                request.itemName().trim(),
                blankToNull(request.itemDescription()),
                blankToNull(request.itemCategory())
        );
        itemRepository.save(item);

        Report report = new Report(
                UUID.randomUUID(),
                item,
                reporter,
                request.type(),
                ReportStatus.OPEN,
                request.location().trim(),
                request.date(),
                request.reporterContact().trim(),
                Instant.now()
        );
        reportRepository.save(report);
        return ReportMapper.toResponse(report, true);
    }

    @Transactional
    public ReportResponse close(UUID id) {
        Report report = requireReport(id);
        User current = authSupport.requireUser();
        reportAccess.requireReporter(report, current, "close this report");
        report.close();
        return ReportMapper.toResponse(report, true);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
