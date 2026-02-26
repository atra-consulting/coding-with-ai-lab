package com.crm.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Firma;

public interface FirmaRepository extends JpaRepository<Firma, Long> {
    Page<Firma> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
