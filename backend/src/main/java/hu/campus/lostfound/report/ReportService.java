package hu.campus.lostfound.report;

import hu.campus.lostfound.auth.AuthSupport;
import hu.campus.lostfound.handover.HandoverRepository;
import hu.campus.lostfound.report.Item;
import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.shared.NotFoundException;
import hu.campus.lostfound.user.User;
import hu.campus.lostfound.user.UserService;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final ItemRepository itemRepository;
    private final HandoverRepository handoverRepository;
    private final UserService userService;
    private final AuthSupport authSupport;

    public ReportService(
            ReportRepository reportRepository,
            ItemRepository itemRepository,
            HandoverRepository handoverRepository,
            UserService userService,
            AuthSupport authSupport
    ) {
        this.reportRepository = reportRepository;
        this.itemRepository = itemRepository;
        this.handoverRepository = handoverRepository;
        this.userService = userService;
        this.authSupport = authSupport;
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
        Report report = requireReport(id);
        return ReportMapper.toResponse(report, canSeeContact(report, viewerId, handoverReportIds(viewerId)));
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
        if (!report.getReporter().getId().equals(current.getId())) {
            throw new ForbiddenException("Only the reporter can close this report");
        }
        if (report.getStatus() != ReportStatus.CLOSED) {
            report.setStatus(ReportStatus.CLOSED);
        }
        return ReportMapper.toResponse(report, true);
    }

    private Set<UUID> handoverReportIds(UUID viewerId) {
        return handoverRepository.findByParticipantId(viewerId).stream()
                .map(h -> h.getClaim().getReport().getId())
                .collect(Collectors.toSet());
    }

    private static boolean canSeeContact(Report report, UUID viewerId, Set<UUID> handoverReportIds) {
        return report.getReporter().getId().equals(viewerId) || handoverReportIds.contains(report.getId());
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
