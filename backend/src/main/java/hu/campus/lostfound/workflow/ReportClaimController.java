package hu.campus.lostfound.workflow;

import hu.campus.lostfound.claim.ClaimResponse;
import hu.campus.lostfound.claim.ClaimService;
import hu.campus.lostfound.handover.HandoverResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reports/{reportId}")
public class ReportClaimController {

    private final ClaimService claimService;
    private final HandoverQueryService handoverQueryService;

    public ReportClaimController(ClaimService claimService, HandoverQueryService handoverQueryService) {
        this.claimService = claimService;
        this.handoverQueryService = handoverQueryService;
    }

    @GetMapping("/claims")
    public List<ClaimResponse> listClaims(@PathVariable UUID reportId) {
        return claimService.listForReport(reportId);
    }

    @GetMapping("/handover")
    public HandoverResponse getHandover(@PathVariable UUID reportId) {
        return handoverQueryService.findHandoverForReport(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No handover for this report"));
    }
}
