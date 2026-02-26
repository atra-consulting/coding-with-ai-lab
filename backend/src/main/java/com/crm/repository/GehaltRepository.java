package com.crm.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.crm.entity.Gehalt;

public interface GehaltRepository extends JpaRepository<Gehalt, Long> {
    Page<Gehalt> findByPersonId(Long personId, Pageable pageable);

    @Query("SELECT AVG(g.amount) FROM Gehalt g WHERE g.typ = com.crm.entity.enums.GehaltTyp.GRUNDGEHALT")
    BigDecimal findAverageGrundgehalt();

    @Query("SELECT a.name, AVG(g.amount) FROM Gehalt g JOIN g.person p JOIN p.abteilung a WHERE g.typ = com.crm.entity.enums.GehaltTyp.GRUNDGEHALT GROUP BY a.name ORDER BY AVG(g.amount) DESC")
    List<Object[]> findAverageSalaryByDepartment();
}
