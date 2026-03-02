package com.crm.ciam.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeyPairConfig {

    @Value("${jwt.key-dir:./keys}")
    private String keyDir;

    @Bean
    public KeyPair rsaKeyPair() throws NoSuchAlgorithmException, IOException, InvalidKeySpecException {
        Path keyDirPath = Path.of(keyDir);
        Path privateKeyPath = keyDirPath.resolve("private.pem");
        Path publicKeyPath = keyDirPath.resolve("public.pem");

        if (Files.exists(privateKeyPath) && Files.exists(publicKeyPath)) {
            return loadKeyPair(privateKeyPath, publicKeyPath);
        }

        Files.createDirectories(keyDirPath);
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        writeKey(privateKeyPath, "PRIVATE KEY", keyPair.getPrivate().getEncoded());
        writeKey(publicKeyPath, "PUBLIC KEY", keyPair.getPublic().getEncoded());

        System.out.println("=== CIAM: RSA-2048 Key Pair generated at " + keyDirPath.toAbsolutePath() + " ===");
        return keyPair;
    }

    private KeyPair loadKeyPair(Path privateKeyPath, Path publicKeyPath)
            throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");

        String privateKeyPem = Files.readString(privateKeyPath);
        String publicKeyPem = Files.readString(publicKeyPath);

        byte[] privateKeyBytes = decodePem(privateKeyPem, "PRIVATE KEY");
        byte[] publicKeyBytes = decodePem(publicKeyPem, "PUBLIC KEY");

        PrivateKey privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privateKeyBytes));
        PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(publicKeyBytes));

        System.out.println("=== CIAM: RSA Key Pair loaded from " + privateKeyPath.getParent().toAbsolutePath() + " ===");
        return new KeyPair(publicKey, privateKey);
    }

    private void writeKey(Path path, String type, byte[] encoded) throws IOException {
        String pem = "-----BEGIN " + type + "-----\n" +
                Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(encoded) +
                "\n-----END " + type + "-----\n";
        Files.writeString(path, pem);
    }

    private byte[] decodePem(String pem, String type) {
        String base64 = pem
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(base64);
    }
}
