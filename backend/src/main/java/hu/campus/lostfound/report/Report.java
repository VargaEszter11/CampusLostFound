package hu.campus.lostfound.report;

import hu.campus.lostfound.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false, unique = true)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReportType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReportStatus status;

    @Column(nullable = false)
    private String location;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Column(name = "reporter_contact", nullable = false)
    private String reporterContact;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Report() {
    }

    public Report(
            UUID id,
            Item item,
            User reporter,
            ReportType type,
            ReportStatus status,
            String location,
            LocalDate occurredOn,
            String reporterContact,
            Instant createdAt
    ) {
        this.id = id;
        this.item = item;
        this.reporter = reporter;
        this.type = type;
        this.status = status;
        this.location = location;
        this.occurredOn = occurredOn;
        this.reporterContact = reporterContact;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Item getItem() {
        return item;
    }

    public User getReporter() {
        return reporter;
    }

    public ReportType getType() {
        return type;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public String getLocation() {
        return location;
    }

    public LocalDate getOccurredOn() {
        return occurredOn;
    }

    public String getReporterContact() {
        return reporterContact;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void close() {
        this.status = ReportStatus.CLOSED;
    }
}
