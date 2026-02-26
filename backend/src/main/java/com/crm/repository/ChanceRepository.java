package com.crm.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Chance;
import com.crm.entity.enums.ChancePhase;

public interface ChanceRepository extends JpaRepository<Chance, Long> {
    Page<Chance> findByFirmaId(Long firmaId, Pageable pageable);
    long countByPhaseNotIn(List<ChancePhase> phases);
}
