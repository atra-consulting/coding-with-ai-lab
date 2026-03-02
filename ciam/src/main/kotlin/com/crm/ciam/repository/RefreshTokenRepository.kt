package com.crm.ciam.repository

import com.crm.ciam.entity.Benutzer
import com.crm.ciam.entity.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.Optional

interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {

    fun findByToken(token: String): Optional<RefreshToken>

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.benutzer = :benutzer")
    fun deleteByBenutzer(@Param("benutzer") benutzer: Benutzer)

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
    fun deleteByExpiryDateBefore(@Param("now") now: Instant)
}
