package com.crm.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Produkt;

public interface ProduktRepository extends JpaRepository<Produkt, Long> {
    Page<Produkt> findByAktiv(boolean aktiv, Pageable pageable);
    Page<Produkt> findByKategorie(com.crm.entity.enums.ProduktKategorie kategorie, Pageable pageable);
}
