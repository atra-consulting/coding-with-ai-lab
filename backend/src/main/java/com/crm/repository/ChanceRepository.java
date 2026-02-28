package com.crm.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.crm.entity.Chance;
import com.crm.entity.enums.ChancePhase;

public interface ChanceRepository extends JpaRepository<Chance, Long> {
    Page<Chance> findByFirmaId(Long firmaId, Pageable pageable);
    long countByPhaseNotIn(List<ChancePhase> phases);
    Page<Chance> findByPhase(ChancePhase phase, Pageable pageable);

    @Query("SELECT c FROM Chance c JOIN FETCH c.firma LEFT JOIN FETCH c.kontaktPerson WHERE c.id = :id")
    java.util.Optional<Chance> findByIdWithRelations(@org.springframework.data.repository.query.Param("id") Long id);

    @Query("SELECT c.phase, COUNT(c), COALESCE(SUM(c.wert), 0) FROM Chance c GROUP BY c.phase")
    List<Object[]> getBoardSummaryRaw();
}
