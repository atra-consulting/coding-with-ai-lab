package com.crm.ciam.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.nio.file.Files
import java.nio.file.Path
import java.security.KeyFactory
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.Base64

@Configuration
class KeyPairConfig(
    @Value("\${jwt.key-dir:./keys}") private val keyDir: String
) {

    @Bean
    fun rsaKeyPair(): KeyPair {
        val keyDirPath = Path.of(keyDir)
        val privateKeyPath = keyDirPath.resolve("private.pem")
        val publicKeyPath = keyDirPath.resolve("public.pem")

        if (Files.exists(privateKeyPath) && Files.exists(publicKeyPath)) {
            return loadKeyPair(privateKeyPath, publicKeyPath)
        }

        Files.createDirectories(keyDirPath)
        val generator = KeyPairGenerator.getInstance("RSA")
        generator.initialize(2048)
        val keyPair = generator.generateKeyPair()

        writeKey(privateKeyPath, "PRIVATE KEY", keyPair.private.encoded)
        writeKey(publicKeyPath, "PUBLIC KEY", keyPair.public.encoded)

        println("=== CIAM: RSA-2048 Key Pair generated at ${keyDirPath.toAbsolutePath()} ===")
        return keyPair
    }

    private fun loadKeyPair(privateKeyPath: Path, publicKeyPath: Path): KeyPair {
        val keyFactory = KeyFactory.getInstance("RSA")

        val privateKeyPem = Files.readString(privateKeyPath)
        val publicKeyPem = Files.readString(publicKeyPath)

        val privateKeyBytes = decodePem(privateKeyPem, "PRIVATE KEY")
        val publicKeyBytes = decodePem(publicKeyPem, "PUBLIC KEY")

        val privateKey = keyFactory.generatePrivate(PKCS8EncodedKeySpec(privateKeyBytes))
        val publicKey = keyFactory.generatePublic(X509EncodedKeySpec(publicKeyBytes))

        println("=== CIAM: RSA Key Pair loaded from ${privateKeyPath.parent.toAbsolutePath()} ===")
        return KeyPair(publicKey, privateKey)
    }

    private fun writeKey(path: Path, type: String, encoded: ByteArray) {
        val pem = "-----BEGIN $type-----\n" +
                Base64.getMimeEncoder(64, "\n".toByteArray()).encodeToString(encoded) +
                "\n-----END $type-----\n"
        Files.writeString(path, pem)
    }

    private fun decodePem(pem: String, type: String): ByteArray {
        val base64 = pem
            .replace("-----BEGIN $type-----", "")
            .replace("-----END $type-----", "")
            .replace("\\s".toRegex(), "")
        return Base64.getDecoder().decode(base64)
    }
}
