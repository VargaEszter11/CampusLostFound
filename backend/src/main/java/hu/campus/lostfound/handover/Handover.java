package hu.campus.lostfound.handover;

import hu.campus.lostfound.claim.Claim;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "handovers")
public class Handover {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private Claim claim;

    @Column(name = "handover_code", nullable = false, unique = true, length = 6)
    private String handoverCode;

    @Column(nullable = false)
    private boolean confirmed;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    protected Handover() {
    }

    public Handover(UUID id, Claim claim, String handoverCode, boolean confirmed, Instant confirmedAt) {
        this.id = id;
        this.claim = claim;
        this.handoverCode = handoverCode;
        this.confirmed = confirmed;
        this.confirmedAt = confirmedAt;
    }

    public UUID getId() {
        return id;
    }

    public Claim getClaim() {
        return claim;
    }

    public String getHandoverCode() {
        return handoverCode;
    }

    public boolean isConfirmed() {
        return confirmed;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void confirm(Instant confirmedAt) {
        this.confirmed = true;
        this.confirmedAt = confirmedAt;
    }
}
