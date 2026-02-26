package com.crm.mapper;

import com.crm.dto.AktivitaetCreateDTO;
import com.crm.dto.AktivitaetDTO;
import com.crm.entity.Aktivitaet;
import com.crm.entity.Firma;
import com.crm.entity.Person;

public final class AktivitaetMapper {
    private AktivitaetMapper() {}

    public static AktivitaetDTO toDTO(Aktivitaet e) {
        return new AktivitaetDTO(
            e.getId(),
            e.getTyp(),
            e.getSubject(),
            e.getDescription(),
            e.getDatum(),
            e.getCreatedAt(),
            e.getFirma() != null ? e.getFirma().getId() : null,
            e.getFirma() != null ? e.getFirma().getName() : null,
            e.getPerson() != null ? e.getPerson().getId() : null,
            e.getPerson() != null ? e.getPerson().getFirstName() + " " + e.getPerson().getLastName() : null
        );
    }

    public static Aktivitaet toEntity(AktivitaetCreateDTO dto, Firma firma, Person person) {
        Aktivitaet e = new Aktivitaet();
        applyToEntity(dto, e);
        e.setFirma(firma);
        e.setPerson(person);
        return e;
    }

    public static void applyToEntity(AktivitaetCreateDTO dto, Aktivitaet e) {
        e.setTyp(dto.typ());
        e.setSubject(dto.subject());
        e.setDescription(dto.description());
        e.setDatum(dto.datum());
    }
}
