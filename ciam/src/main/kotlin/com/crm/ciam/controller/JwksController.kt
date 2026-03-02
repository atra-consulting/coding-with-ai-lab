package com.crm.ciam.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.security.KeyPair
import java.security.interfaces.RSAPublicKey
import java.util.Base64

@RestController
class JwksController(rsaKeyPair: KeyPair) {

    private val publicKey: RSAPublicKey = rsaKeyPair.public as RSAPublicKey

    @GetMapping("/.well-known/jwks.json")
    fun jwks(): Map<String, Any> {
        val jwk = mapOf(
            "kty" to "RSA",
            "use" to "sig",
            "alg" to "RS256",
            "n" to Base64.getUrlEncoder().withoutPadding().encodeToString(publicKey.modulus.toByteArray()),
            "e" to Base64.getUrlEncoder().withoutPadding().encodeToString(publicKey.publicExponent.toByteArray())
        )
        return mapOf("keys" to listOf(jwk))
    }
}
