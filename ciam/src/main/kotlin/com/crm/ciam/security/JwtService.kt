package com.crm.ciam.security

import com.crm.ciam.entity.Benutzer
import io.jsonwebtoken.Claims
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.KeyPair
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.util.Date

@Service
class JwtService(
    rsaKeyPair: KeyPair,
    @Value("\${jwt.access-token-expiration}") private val accessTokenExpiration: Long
) {

    private val privateKey: RSAPrivateKey = rsaKeyPair.private as RSAPrivateKey
    private val publicKey: RSAPublicKey = rsaKeyPair.public as RSAPublicKey

    fun generateAccessToken(benutzer: Benutzer): String {
        val rollen = benutzer.rollen.map { it.name }
        val permissions = RolePermissionMapping.getPermissions(benutzer.rollen).map { it.name }

        return Jwts.builder()
            .subject(benutzer.benutzername)
            .claim("rollen", rollen)
            .claim("permissions", permissions)
            .claim("vorname", benutzer.vorname)
            .claim("nachname", benutzer.nachname)
            .claim("benutzerId", benutzer.id)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + accessTokenExpiration))
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact()
    }

    fun extractUsername(token: String): String =
        extractAllClaims(token).subject

    fun validateToken(token: String): Boolean =
        try {
            extractAllClaims(token)
            true
        } catch (e: JwtException) {
            false
        } catch (e: IllegalArgumentException) {
            false
        }

    fun extractAllClaims(token: String): Claims =
        Jwts.parser()
            .verifyWith(publicKey)
            .build()
            .parseSignedClaims(token)
            .payload
}
