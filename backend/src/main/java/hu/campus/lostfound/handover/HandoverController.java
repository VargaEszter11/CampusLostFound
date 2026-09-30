package hu.campus.lostfound.handover;

import hu.campus.lostfound.handover.HandoverService;
import hu.campus.lostfound.handover.HandoverListItemResponse;
import hu.campus.lostfound.handover.HandoverResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/handovers")
public class HandoverController {

    private final HandoverService handoverService;

    public HandoverController(HandoverService handoverService) {
        this.handoverService = handoverService;
    }

    @GetMapping
    public List<HandoverListItemResponse> listMine() {
        return handoverService.listForCurrentUser();
    }

    @PostMapping("/{id}/confirm")
    public HandoverResponse confirm(@PathVariable UUID id) {
        return handoverService.confirm(id);
    }
}
