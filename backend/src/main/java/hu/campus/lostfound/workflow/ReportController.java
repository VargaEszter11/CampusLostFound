package hu.campus.lostfound.workflow;

import hu.campus.lostfound.report.CreateReportRequest;
import hu.campus.lostfound.report.ReportResponse;
import hu.campus.lostfound.report.ReportService;
import hu.campus.lostfound.report.ReportStatus;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final ReportViewService reportViewService;

    public ReportController(ReportService reportService, ReportViewService reportViewService) {
        this.reportService = reportService;
        this.reportViewService = reportViewService;
    }

    @GetMapping
    public List<ReportResponse> list(@RequestParam(required = false) ReportStatus status) {
        return reportViewService.list(status);
    }

    @GetMapping("/{id}")
    public ReportResponse get(@PathVariable UUID id) {
        return reportViewService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse create(@Valid @RequestBody CreateReportRequest request) {
        return reportService.create(request);
    }

    @PostMapping("/{id}/close")
    public ReportResponse close(@PathVariable UUID id) {
        return reportService.close(id);
    }
}
