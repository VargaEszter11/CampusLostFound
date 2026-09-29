package hu.campus.lostfound.report;

import hu.campus.lostfound.report.Report;
import hu.campus.lostfound.report.ReportStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    @Override
    @EntityGraph(attributePaths = {"item", "reporter"})
    Optional<Report> findById(UUID id);

    @EntityGraph(attributePaths = {"item", "reporter"})
    List<Report> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"item", "reporter"})
    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);
}
