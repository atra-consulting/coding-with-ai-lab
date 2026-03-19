package com.crm.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.crm.entity.Vertrag;

public interface VertragRepository extends JpaRepository<Vertrag, Long> {
    Page<Vertrag> findByFirmaId(Long firmaId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(v.wert), 0) FROM Vertrag v WHERE v.status = com.crm.entity.enums.VertragStatus.AKTIV")
    BigDecimal findTotalActiveVertragswert();

    @Query("SELECT v.firma.id, v.firma.name, COALESCE(SUM(v.wert), 0) FROM Vertrag v WHERE v.status = com.crm.entity.enums.VertragStatus.AKTIV GROUP BY v.firma.id, v.firma.name ORDER BY SUM(v.wert) DESC")
    List<Object[]> findTopFirmenByVertragswert();

    @EntityGraph(attributePaths = {"firma"})
    Page<Vertrag> findAllWithFirmaBy(Pageable pageable);
}
