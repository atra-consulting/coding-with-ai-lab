package com.crm.ciam.mapper

import com.crm.ciam.dto.BenutzerCreateDTO
import com.crm.ciam.dto.BenutzerDTO
import com.crm.ciam.entity.Benutzer
import com.crm.ciam.entity.enums.BenutzerRolle
import org.springframework.security.crypto.password.PasswordEncoder

object BenutzerMapper {

    fun toDTO(e: Benutzer): BenutzerDTO = BenutzerDTO(
        id = e.id,
        benutzername = e.benutzername,
        vorname = e.vorname,
        nachname = e.nachname,
        email = e.email,
        rollen = e.rollen.map { it.name },
        aktiv = e.aktiv,
        createdAt = e.createdAt,
        updatedAt = e.updatedAt
    )

    fun toEntity(dto: BenutzerCreateDTO, encoder: PasswordEncoder): Benutzer {
        val e = Benutzer()
        e.benutzername = dto.benutzername
        e.passwort = encoder.encode(dto.passwort)
        e.vorname = dto.vorname
        e.nachname = dto.nachname
        e.email = dto.email
        e.rollen = parseRollen(dto.rollen)
        e.aktiv = dto.aktiv
        return e
    }

    fun applyToEntity(dto: BenutzerCreateDTO, e: Benutzer, encoder: PasswordEncoder) {
        e.vorname = dto.vorname
        e.nachname = dto.nachname
        e.email = dto.email
        e.rollen = parseRollen(dto.rollen)
        e.aktiv = dto.aktiv
        if (!dto.passwort.isNullOrBlank()) {
            e.passwort = encoder.encode(dto.passwort)
        }
    }

    private fun parseRollen(rollen: Set<String>): MutableSet<BenutzerRolle> =
        rollen.map { BenutzerRolle.valueOf(it) }.toMutableSet()
}
