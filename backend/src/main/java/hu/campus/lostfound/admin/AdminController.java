package hu.campus.lostfound.admin;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminReportService adminReportService;

    public AdminController(AdminReportService adminReportService) {
        this.adminReportService = adminReportService;
    }

    @GetMapping("/reports")
    public List<AdminReportResponse> reports() {
        return adminReportService.listAll();
    }
}
