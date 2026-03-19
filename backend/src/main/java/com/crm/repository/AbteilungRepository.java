package com.crm.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Abteilung;

public interface AbteilungRepository extends JpaRepository<Abteilung, Long> {
    Page<Abteilung> findByFirmaId(Long firmaId, Pageable pageable);
    List<Abteilung> findAllByFirmaId(Long firmaId);

    @EntityGraph(attributePaths = {"firma"})
    Page<Abteilung> findAllWithFirmaBy(Pageable pageable);
}
