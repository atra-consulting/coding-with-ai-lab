package com.crm.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Adresse;

public interface AdresseRepository extends JpaRepository<Adresse, Long> {
    Page<Adresse> findByFirmaId(Long firmaId, Pageable pageable);
    Page<Adresse> findByPersonId(Long personId, Pageable pageable);
}
