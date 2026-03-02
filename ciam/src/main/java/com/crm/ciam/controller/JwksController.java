package com.crm.ciam.controller;

import java.security.KeyPair;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JwksController {

    private final RSAPublicKey publicKey;

    public JwksController(KeyPair rsaKeyPair) {
        this.publicKey = (RSAPublicKey) rsaKeyPair.getPublic();
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> jwks() {
        Map<String, Object> jwk = Map.of(
                "kty", "RSA",
                "use", "sig",
                "alg", "RS256",
                "n", Base64.getUrlEncoder().withoutPadding().encodeToString(publicKey.getModulus().toByteArray()),
                "e", Base64.getUrlEncoder().withoutPadding().encodeToString(publicKey.getPublicExponent().toByteArray())
        );
        return Map.of("keys", List.of(jwk));
    }
}
