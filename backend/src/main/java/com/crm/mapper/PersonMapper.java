package com.crm.mapper;

import com.crm.dto.PersonCreateDTO;
import com.crm.dto.PersonDTO;
import com.crm.entity.Abteilung;
import com.crm.entity.Firma;
import com.crm.entity.Person;

public final class PersonMapper {
    private PersonMapper() {}

    public static PersonDTO toDTO(Person e) {
        return new PersonDTO(
            e.getId(),
            e.getFirstName(),
            e.getLastName(),
            e.getEmail(),
            e.getPhone(),
            e.getPosition(),
            e.getNotes(),
            e.getCreatedAt(),
            e.getUpdatedAt(),
            e.getFirma().getId(),
            e.getFirma().getName(),
            e.getAbteilung() != null ? e.getAbteilung().getId() : null,
            e.getAbteilung() != null ? e.getAbteilung().getName() : null
        );
    }

    public static Person toEntity(PersonCreateDTO dto, Firma firma, Abteilung abteilung) {
        Person e = new Person();
        applyToEntity(dto, e);
        e.setFirma(firma);
        e.setAbteilung(abteilung);
        return e;
    }

    public static void applyToEntity(PersonCreateDTO dto, Person e) {
        e.setFirstName(dto.firstName());
        e.setLastName(dto.lastName());
        e.setEmail(dto.email());
        e.setPhone(dto.phone());
        e.setPosition(dto.position());
        e.setNotes(dto.notes());
    }
}
