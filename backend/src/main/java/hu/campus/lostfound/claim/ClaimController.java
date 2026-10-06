package hu.campus.lostfound.claim;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @GetMapping
    public List<ClaimResponse> listMine() {
        return claimService.listForCurrentUser();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimResponse create(@Valid @RequestBody CreateClaimRequest request) {
        return claimService.create(request);
    }

    @PostMapping("/{id}/reject")
    public ClaimResponse reject(@PathVariable UUID id) {
        return claimService.reject(id);
    }
}
