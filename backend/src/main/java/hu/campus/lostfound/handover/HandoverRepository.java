package hu.campus.lostfound.handover;

import hu.campus.lostfound.handover.Handover;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HandoverRepository extends JpaRepository<Handover, UUID> {

    @EntityGraph(attributePaths = {"claim", "claim.claimant", "claim.report"})
    Optional<Handover> findByClaimId(UUID claimId);

    Optional<Handover> findByHandoverCode(String handoverCode);

    @Query("""
            select h from Handover h
            join fetch h.claim c
            join fetch c.claimant
            join fetch c.report r
            where r.id = :reportId and c.status = hu.campus.lostfound.claim.ClaimStatus.APPROVED
            """)
    Optional<Handover> findApprovedForReport(@Param("reportId") UUID reportId);

    @Query("""
            select h from Handover h
            join fetch h.claim c
            join fetch c.claimant cl
            join fetch c.report r
            join fetch r.item
            join fetch r.reporter
            where lower(cl.displayName) = lower(:name)
               or lower(r.reporter.displayName) = lower(:name)
            order by c.createdAt desc
            """)
    List<Handover> findByParticipantNameIgnoreCase(@Param("name") String name);

    @Query("""
            select h from Handover h
            join fetch h.claim c
            join fetch c.claimant cl
            join fetch c.report r
            join fetch r.item
            join fetch r.reporter
            where cl.id = :userId or r.reporter.id = :userId
            order by c.createdAt desc
            """)
    List<Handover> findByParticipantId(@Param("userId") UUID userId);

    @Override
    @EntityGraph(attributePaths = {"claim", "claim.claimant", "claim.report", "claim.report.item", "claim.report.reporter"})
    Optional<Handover> findById(UUID id);
}
