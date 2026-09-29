package hu.campus.lostfound.claim;

import hu.campus.lostfound.claim.Claim;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRepository extends JpaRepository<Claim, UUID> {

    @Override
    @EntityGraph(attributePaths = {"claimant", "report", "report.item", "report.reporter"})
    Optional<Claim> findById(UUID id);

    @EntityGraph(attributePaths = {"claimant", "report"})
    List<Claim> findByReportIdOrderByCreatedAtAsc(UUID reportId);

    @EntityGraph(attributePaths = {"claimant", "report", "report.item"})
    List<Claim> findByClaimant_DisplayNameIgnoreCaseOrderByCreatedAtDesc(String displayName);
}
