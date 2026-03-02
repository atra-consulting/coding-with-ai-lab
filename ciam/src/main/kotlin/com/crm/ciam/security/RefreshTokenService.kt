package com.crm.ciam.security

import com.crm.ciam.entity.Benutzer
import com.crm.ciam.entity.RefreshToken
import com.crm.ciam.exception.TokenRefreshException
import com.crm.ciam.repository.RefreshTokenRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class RefreshTokenService(
    private val refreshTokenRepository: RefreshTokenRepository,
    @Value("\${jwt.refresh-token-expiration}") private val refreshTokenExpiration: Long
) {

    fun createRefreshToken(benutzer: Benutzer): RefreshToken {
        val refreshToken = RefreshToken()
        refreshToken.benutzer = benutzer
        refreshToken.token = UUID.randomUUID().toString()
        refreshToken.expiryDate = Instant.now().plusMillis(refreshTokenExpiration)
        refreshToken.createdAt = Instant.now()
        return refreshTokenRepository.save(refreshToken)
    }

    @Transactional(readOnly = true)
    fun validateRefreshToken(token: String): RefreshToken {
        val refreshToken = refreshTokenRepository.findByToken(token)
            .orElseThrow { TokenRefreshException("Ungültiger Refresh-Token") }

        if (refreshToken.expiryDate!!.isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken)
            throw TokenRefreshException("Refresh-Token abgelaufen")
        }

        return refreshToken
    }

    fun deleteByBenutzer(benutzer: Benutzer) {
        refreshTokenRepository.deleteByBenutzer(benutzer)
    }
}
