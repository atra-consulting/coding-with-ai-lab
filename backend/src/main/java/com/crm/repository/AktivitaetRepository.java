package com.crm.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Aktivitaet;

public interface AktivitaetRepository extends JpaRepository<Aktivitaet, Long> {
    Page<Aktivitaet> findByFirmaId(Long firmaId, Pageable pageable);
    Page<Aktivitaet> findByPersonId(Long personId, Pageable pageable);
    List<Aktivitaet> findTop10ByOrderByDatumDesc();

    @EntityGraph(attributePaths = {"firma", "person"})
    Page<Aktivitaet> findAllWithRelationsBy(Pageable pageable);
}
