package com.crm.security;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

@Service
public class JwtService {

    private final RSAPublicKey publicKey;

    public JwtService(@Value("${jwt.public-key-path}") String publicKeyPath) {
        this.publicKey = loadPublicKey(publicKeyPath);
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractBenutzerId(String token) {
        return extractAllClaims(token).get("benutzerId", Long.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRollen(String token) {
        List<String> rollen = extractAllClaims(token).get("rollen", List.class);
        return rollen != null ? rollen : Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(String token) {
        List<String> permissions = extractAllClaims(token).get("permissions", List.class);
        return permissions != null ? permissions : Collections.emptyList();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private RSAPublicKey loadPublicKey(String path) {
        try {
            String pem = Files.readString(Path.of(path));
            String base64 = pem
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] keyBytes = Base64.getDecoder().decode(base64);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) keyFactory.generatePublic(new X509EncodedKeySpec(keyBytes));
        } catch (IOException | NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Failed to load RSA public key from " + path, e);
        }
    }
}
