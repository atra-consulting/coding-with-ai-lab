package com.crm.ciam.seed;

import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.crm.ciam.entity.Benutzer;
import com.crm.ciam.entity.enums.BenutzerRolle;
import com.crm.ciam.repository.BenutzerRepository;

@Component
public class UserSeeder implements CommandLineRunner {

    private final BenutzerRepository benutzerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserSeeder(BenutzerRepository benutzerRepository, PasswordEncoder passwordEncoder) {
        this.benutzerRepository = benutzerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (benutzerRepository.count() > 0) return;

        Benutzer admin = new Benutzer();
        admin.setBenutzername("admin");
        admin.setPasswort(passwordEncoder.encode("admin123"));
        admin.setVorname("Admin");
        admin.setNachname("System");
        admin.setEmail("admin@crm.local");
        admin.setRollen(Set.of(BenutzerRolle.ADMIN));
        benutzerRepository.save(admin);

        Benutzer vertrieb = new Benutzer();
        vertrieb.setBenutzername("vertrieb");
        vertrieb.setPasswort(passwordEncoder.encode("test123"));
        vertrieb.setVorname("Vera");
        vertrieb.setNachname("Vertrieb");
        vertrieb.setEmail("vertrieb@crm.local");
        vertrieb.setRollen(Set.of(BenutzerRolle.VERTRIEB));
        benutzerRepository.save(vertrieb);

        Benutzer personal = new Benutzer();
        personal.setBenutzername("personal");
        personal.setPasswort(passwordEncoder.encode("test123"));
        personal.setVorname("Paul");
        personal.setNachname("Personal");
        personal.setEmail("personal@crm.local");
        personal.setRollen(Set.of(BenutzerRolle.PERSONAL));
        benutzerRepository.save(personal);

        Benutzer allrounder = new Benutzer();
        allrounder.setBenutzername("allrounder");
        allrounder.setPasswort(passwordEncoder.encode("test123"));
        allrounder.setVorname("Alex");
        allrounder.setNachname("Allrounder");
        allrounder.setEmail("allrounder@crm.local");
        allrounder.setRollen(Set.of(BenutzerRolle.VERTRIEB, BenutzerRolle.PERSONAL));
        benutzerRepository.save(allrounder);

        Benutzer demo = new Benutzer();
        demo.setBenutzername("demo");
        demo.setPasswort(passwordEncoder.encode("demo1234"));
        demo.setVorname("David");
        demo.setNachname("Demo");
        demo.setEmail("demo@crm.local");
        demo.setRollen(Set.of(BenutzerRolle.ADMIN));
        benutzerRepository.save(demo);

        System.out.println("=== CIAM UserSeeder: 5 Benutzer erstellt ===");
    }
}
