package com.crm.ciam.security;

import java.security.KeyPair;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.crm.ciam.entity.Benutzer;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

@Service
public class JwtService {

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;
    private final long accessTokenExpiration;

    public JwtService(
            KeyPair rsaKeyPair,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration) {
        this.privateKey = (RSAPrivateKey) rsaKeyPair.getPrivate();
        this.publicKey = (RSAPublicKey) rsaKeyPair.getPublic();
        this.accessTokenExpiration = accessTokenExpiration;
    }

    public String generateAccessToken(Benutzer benutzer) {
        List<String> rollen = benutzer.getRollen().stream()
                .map(Enum::name)
                .toList();

        List<String> permissions = RolePermissionMapping.getPermissions(benutzer.getRollen()).stream()
                .map(Permission::name)
                .toList();

        return Jwts.builder()
                .subject(benutzer.getBenutzername())
                .claim("rollen", rollen)
                .claim("permissions", permissions)
                .claim("vorname", benutzer.getVorname())
                .claim("nachname", benutzer.getNachname())
                .claim("benutzerId", benutzer.getId())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
