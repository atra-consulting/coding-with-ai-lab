package com.crm.ciam.controller

import com.crm.ciam.dto.BenutzerInfoDTO
import com.crm.ciam.dto.LoginRequestDTO
import com.crm.ciam.dto.LoginResponseDTO
import com.crm.ciam.dto.RefreshResponseDTO
import com.crm.ciam.security.BenutzerDetails
import com.crm.ciam.security.JwtService
import com.crm.ciam.security.Permission
import com.crm.ciam.security.RefreshTokenService
import com.crm.ciam.security.RolePermissionMapping
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val refreshTokenService: RefreshTokenService,
    @Value("\${app.demo-mode:false}") private val demoMode: Boolean,
    @Value("\${app.cookie.secure:true}") private val cookieSecure: Boolean
) {

    @GetMapping("/demo-mode")
    fun getDemoMode(): Map<String, Boolean> = mapOf("enabled" to demoMode)

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequestDTO): ResponseEntity<LoginResponseDTO> {
        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(request.benutzername, request.passwort)
        )

        val benutzerDetails = authentication.principal as BenutzerDetails
        val benutzer = benutzerDetails.benutzer

        val accessToken = jwtService.generateAccessToken(benutzer)
        val refreshToken = refreshTokenService.createRefreshToken(benutzer)

        val rollen = benutzer.rollen.map { it.name }

        val response = LoginResponseDTO(
            accessToken, benutzer.benutzername,
            benutzer.vorname, benutzer.nachname, rollen
        )

        val cookie = createRefreshTokenCookie(refreshToken.token, 7L * 24 * 60 * 60)

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(response)
    }

    @PostMapping("/refresh")
    fun refresh(request: HttpServletRequest): ResponseEntity<RefreshResponseDTO> {
        val refreshTokenValue = extractRefreshTokenFromCookies(request) ?: return ResponseEntity.status(401).build()

        val refreshToken = refreshTokenService.validateRefreshToken(refreshTokenValue)
        val benutzer = refreshToken.benutzer!!

        if (!benutzer.aktiv) {
            refreshTokenService.deleteByBenutzer(benutzer)
            val cookie = createRefreshTokenCookie("", 0)
            return ResponseEntity.status(401)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build()
        }

        val accessToken = jwtService.generateAccessToken(benutzer)

        return ResponseEntity.ok(RefreshResponseDTO(accessToken))
    }

    @PostMapping("/logout")
    fun logout(request: HttpServletRequest): ResponseEntity<Void> {
        val refreshTokenValue = extractRefreshTokenFromCookies(request)
        if (refreshTokenValue != null) {
            try {
                val refreshToken = refreshTokenService.validateRefreshToken(refreshTokenValue)
                refreshTokenService.deleteByBenutzer(refreshToken.benutzer!!)
            } catch (_: Exception) {
                // Token already invalid, just clear cookie
            }
        }

        val cookie = createRefreshTokenCookie("", 0)

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .build()
    }

    @GetMapping("/me")
    fun me(authentication: Authentication?): ResponseEntity<BenutzerInfoDTO> {
        if (authentication == null) {
            return ResponseEntity.status(401).build()
        }

        val benutzerDetails = authentication.principal as BenutzerDetails
        val benutzer = benutzerDetails.benutzer

        val rollen = benutzer.rollen.map { it.name }
        val permissions = RolePermissionMapping.getPermissions(benutzer.rollen).map { it.name }

        return ResponseEntity.ok(
            BenutzerInfoDTO(
                benutzer.id, benutzer.benutzername,
                benutzer.vorname, benutzer.nachname,
                benutzer.email, rollen, permissions
            )
        )
    }

    private fun extractRefreshTokenFromCookies(request: HttpServletRequest): String? {
        val cookies = request.cookies ?: return null
        return cookies.firstOrNull { it.name == "refreshToken" }?.value
    }

    private fun createRefreshTokenCookie(value: String, maxAge: Long): ResponseCookie =
        ResponseCookie.from("refreshToken", value)
            .httpOnly(true)
            .secure(cookieSecure)
            .path("/api/auth")
            .maxAge(maxAge)
            .sameSite("Strict")
            .build()
}
