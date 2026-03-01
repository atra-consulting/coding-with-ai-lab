package com.crm.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.BenutzerInfoDTO;
import com.crm.dto.LoginRequestDTO;
import com.crm.dto.LoginResponseDTO;
import com.crm.dto.RefreshResponseDTO;
import com.crm.entity.Benutzer;
import com.crm.entity.RefreshToken;
import com.crm.security.BenutzerDetails;
import com.crm.security.JwtService;
import com.crm.security.Permission;
import com.crm.security.RefreshTokenService;
import com.crm.security.RolePermissionMapping;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${app.demo-mode:false}")
    private boolean demoMode;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @GetMapping("/demo-mode")
    public Map<String, Boolean> getDemoMode() {
        return Map.of("enabled", demoMode);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.benutzername(), request.passwort()));

        BenutzerDetails benutzerDetails = (BenutzerDetails) authentication.getPrincipal();
        Benutzer benutzer = benutzerDetails.getBenutzer();

        String accessToken = jwtService.generateAccessToken(benutzer);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(benutzer);

        List<String> rollen = benutzer.getRollen().stream()
                .map(Enum::name)
                .toList();

        LoginResponseDTO response = new LoginResponseDTO(
                accessToken, benutzer.getBenutzername(),
                benutzer.getVorname(), benutzer.getNachname(), rollen);

        ResponseCookie cookie = createRefreshTokenCookie(refreshToken.getToken(), 7 * 24 * 60 * 60);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponseDTO> refresh(HttpServletRequest request) {
        String refreshTokenValue = extractRefreshTokenFromCookies(request);
        if (refreshTokenValue == null) {
            return ResponseEntity.status(401).build();
        }

        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
        Benutzer benutzer = refreshToken.getBenutzer();

        if (!benutzer.isAktiv()) {
            refreshTokenService.deleteByBenutzer(benutzer);
            ResponseCookie cookie = createRefreshTokenCookie("", 0);
            return ResponseEntity.status(401)
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .build();
        }

        String accessToken = jwtService.generateAccessToken(benutzer);

        return ResponseEntity.ok(new RefreshResponseDTO(accessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshTokenValue = extractRefreshTokenFromCookies(request);
        if (refreshTokenValue != null) {
            try {
                RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
                refreshTokenService.deleteByBenutzer(refreshToken.getBenutzer());
            } catch (Exception ignored) {
                // Token already invalid, just clear cookie
            }
        }

        ResponseCookie cookie = createRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<BenutzerInfoDTO> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        BenutzerDetails benutzerDetails = (BenutzerDetails) authentication.getPrincipal();
        Benutzer benutzer = benutzerDetails.getBenutzer();

        List<String> rollen = benutzer.getRollen().stream()
                .map(Enum::name)
                .toList();

        List<String> permissions = RolePermissionMapping.getPermissions(benutzer.getRollen()).stream()
                .map(Permission::name)
                .toList();

        return ResponseEntity.ok(new BenutzerInfoDTO(
                benutzer.getId(), benutzer.getBenutzername(),
                benutzer.getVorname(), benutzer.getNachname(),
                benutzer.getEmail(), rollen, permissions));
    }

    private String extractRefreshTokenFromCookies(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie createRefreshTokenCookie(String value, long maxAge) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/auth")
                .maxAge(maxAge)
                .sameSite("Strict")
                .build();
    }
}
