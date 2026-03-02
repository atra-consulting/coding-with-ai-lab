package com.crm.ciam.repository

import com.crm.ciam.entity.Benutzer
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional

interface BenutzerRepository : JpaRepository<Benutzer, Long> {

    fun findByBenutzername(benutzername: String): Optional<Benutzer>

    fun existsByBenutzername(benutzername: String): Boolean

    fun existsByEmail(email: String): Boolean

    @Query(
        "SELECT b FROM Benutzer b WHERE LOWER(b.benutzername) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(b.vorname) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(b.nachname) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(b.email) LIKE LOWER(CONCAT('%', :search, '%'))"
    )
    fun search(@Param("search") search: String, pageable: Pageable): Page<Benutzer>
}
