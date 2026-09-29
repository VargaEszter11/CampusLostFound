package hu.campus.lostfound.report;

import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final ItemRepository itemRepository;
    private final UserService userService;

    public ReportService(
            ReportRepository reportRepository,
            ItemRepository itemRepository,
            UserService userService
    ) {
        this.reportRepository = reportRepository;
        this.itemRepository = itemRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> list(ReportStatus status) {
        List<Report> reports = status == null
                ? reportRepository.findAllByOrderByCreatedAtDesc()
                : reportRepository.findByStatusOrderByCreatedAtDesc(status);
        return reports.stream().map(ReportMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReportResponse get(UUID id) {
        return ReportMapper.toResponse(requireReport(id));
    }

    @Transactional(readOnly = true)
    public Report requireReport(UUID id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Report not found: " + id));
    }

    @Transactional
    public ReportResponse create(CreateReportRequest request) {
        userService.validateContact(request.reporterContact());

        User reporter = userService.resolveOrCreate(
                request.reporterName().trim(),
                request.reporterContact().trim()
        );
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
        return ReportMapper.toResponse(report);
    }

    @Transactional
    public ReportResponse close(UUID id) {
        Report report = requireReport(id);
        if (report.getStatus() == ReportStatus.CLOSED) {
            return ReportMapper.toResponse(report);
        }
        report.setStatus(ReportStatus.CLOSED);
        return ReportMapper.toResponse(report);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
