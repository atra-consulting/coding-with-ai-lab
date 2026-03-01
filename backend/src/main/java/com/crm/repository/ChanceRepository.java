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

    @Query("SELECT COALESCE(SUM(c.wert), 0) FROM Chance c WHERE c.phase NOT IN :phases")
    Object sumWertByPhaseNotIn(@org.springframework.data.repository.query.Param("phases") List<ChancePhase> phases);

    @Query("SELECT COALESCE(AVG(c.wert), 0) FROM Chance c")
    Object avgWert();

    @Query("SELECT COUNT(c) FROM Chance c WHERE c.phase = :phase")
    long countByPhase(@org.springframework.data.repository.query.Param("phase") ChancePhase phase);

    @Query("SELECT c.phase, COUNT(c), COALESCE(SUM(c.wert), 0), COALESCE(AVG(c.wert), 0), COALESCE(SUM(c.wert * c.wahrscheinlichkeit / 100.0), 0) FROM Chance c GROUP BY c.phase")
    List<Object[]> getPhaseAggregatesRaw();

    @Query("SELECT c.firma.id, c.firma.name, COUNT(c), COALESCE(SUM(c.wert), 0) FROM Chance c WHERE c.phase NOT IN :phases GROUP BY c.firma.id, c.firma.name ORDER BY SUM(c.wert) DESC")
    List<Object[]> getTopFirmenRaw(@org.springframework.data.repository.query.Param("phases") List<ChancePhase> phases, Pageable pageable);
}
