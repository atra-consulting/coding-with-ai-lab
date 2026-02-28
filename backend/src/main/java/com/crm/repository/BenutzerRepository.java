package com.crm.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crm.entity.Benutzer;

public interface BenutzerRepository extends JpaRepository<Benutzer, Long> {

    Optional<Benutzer> findByBenutzername(String benutzername);

    boolean existsByBenutzername(String benutzername);

    boolean existsByEmail(String email);

    @Query("SELECT b FROM Benutzer b WHERE LOWER(b.benutzername) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.vorname) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.nachname) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(b.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Benutzer> search(@Param("search") String search, Pageable pageable);
}
