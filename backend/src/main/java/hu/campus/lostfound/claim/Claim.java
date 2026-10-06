package hu.campus.lostfound.claim;

import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.shared.BadRequestException;
import hu.campus.lostfound.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claimant_id", nullable = false)
    private User claimant;

    @Column(name = "claimant_contact", nullable = false)
    private String claimantContact;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ClaimStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Claim() {
    }

    public Claim(
            UUID id,
            Report report,
            User claimant,
            String claimantContact,
            String reason,
            ClaimStatus status,
            Instant createdAt
    ) {
        this.id = id;
        this.report = report;
        this.claimant = claimant;
        this.claimantContact = claimantContact;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Report getReport() {
        return report;
    }

    public User getClaimant() {
        return claimant;
    }

    public String getClaimantContact() {
        return claimantContact;
    }

    public String getReason() {
        return reason;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void approve() {
        requirePending();
        this.status = ClaimStatus.APPROVED;
    }

    public void reject() {
        requirePending();
        this.status = ClaimStatus.REJECTED;
    }

    private void requirePending() {
        if (status != ClaimStatus.PENDING) {
            throw new BadRequestException("This claim was already resolved");
        }
    }
}
