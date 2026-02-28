package com.crm.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.crm.dto.BenutzerCreateDTO;
import com.crm.dto.BenutzerDTO;
import com.crm.entity.Benutzer;
import com.crm.entity.enums.BenutzerRolle;

public final class BenutzerMapper {

    private BenutzerMapper() {}

    public static BenutzerDTO toDTO(Benutzer e) {
        return new BenutzerDTO(
                e.getId(),
                e.getBenutzername(),
                e.getVorname(),
                e.getNachname(),
                e.getEmail(),
                e.getRollen().stream().map(Enum::name).toList(),
                e.isAktiv(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public static Benutzer toEntity(BenutzerCreateDTO dto, PasswordEncoder encoder) {
        Benutzer e = new Benutzer();
        e.setBenutzername(dto.benutzername());
        e.setPasswort(encoder.encode(dto.passwort()));
        e.setVorname(dto.vorname());
        e.setNachname(dto.nachname());
        e.setEmail(dto.email());
        e.setRollen(parseRollen(dto.rollen()));
        e.setAktiv(dto.aktiv());
        return e;
    }

    public static void applyToEntity(BenutzerCreateDTO dto, Benutzer e, PasswordEncoder encoder) {
        e.setVorname(dto.vorname());
        e.setNachname(dto.nachname());
        e.setEmail(dto.email());
        e.setRollen(parseRollen(dto.rollen()));
        e.setAktiv(dto.aktiv());
        if (dto.passwort() != null && !dto.passwort().isBlank()) {
            e.setPasswort(encoder.encode(dto.passwort()));
        }
    }

    private static Set<BenutzerRolle> parseRollen(Set<String> rollen) {
        return rollen.stream()
                .map(BenutzerRolle::valueOf)
                .collect(Collectors.toSet());
    }
}
