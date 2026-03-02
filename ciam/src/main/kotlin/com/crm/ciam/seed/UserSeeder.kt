package com.crm.ciam.seed

import com.crm.ciam.entity.Benutzer
import com.crm.ciam.entity.enums.BenutzerRolle
import com.crm.ciam.repository.BenutzerRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class UserSeeder(
    private val benutzerRepository: BenutzerRepository,
    private val passwordEncoder: PasswordEncoder
) : CommandLineRunner {

    @Transactional
    override fun run(vararg args: String) {
        if (benutzerRepository.count() > 0) return

        val admin = Benutzer().apply {
            benutzername = "admin"
            passwort = passwordEncoder.encode("admin123")
            vorname = "Admin"
            nachname = "System"
            email = "admin@crm.local"
            rollen = mutableSetOf(BenutzerRolle.ADMIN)
        }
        benutzerRepository.save(admin)

        val vertrieb = Benutzer().apply {
            benutzername = "vertrieb"
            passwort = passwordEncoder.encode("test123")
            vorname = "Vera"
            nachname = "Vertrieb"
            email = "vertrieb@crm.local"
            rollen = mutableSetOf(BenutzerRolle.VERTRIEB)
        }
        benutzerRepository.save(vertrieb)

        val personal = Benutzer().apply {
            benutzername = "personal"
            passwort = passwordEncoder.encode("test123")
            vorname = "Paul"
            nachname = "Personal"
            email = "personal@crm.local"
            rollen = mutableSetOf(BenutzerRolle.PERSONAL)
        }
        benutzerRepository.save(personal)

        val allrounder = Benutzer().apply {
            benutzername = "allrounder"
            passwort = passwordEncoder.encode("test123")
            vorname = "Alex"
            nachname = "Allrounder"
            email = "allrounder@crm.local"
            rollen = mutableSetOf(BenutzerRolle.VERTRIEB, BenutzerRolle.PERSONAL)
        }
        benutzerRepository.save(allrounder)

        val demo = Benutzer().apply {
            benutzername = "demo"
            passwort = passwordEncoder.encode("demo1234")
            vorname = "David"
            nachname = "Demo"
            email = "demo@crm.local"
            rollen = mutableSetOf(BenutzerRolle.ADMIN)
        }
        benutzerRepository.save(demo)

        println("=== CIAM UserSeeder: 5 Benutzer erstellt ===")
    }
}
