package com.crm.mapper;

import com.crm.dto.VertragCreateDTO;
import com.crm.dto.VertragDTO;
import com.crm.entity.Firma;
import com.crm.entity.Person;
import com.crm.entity.Vertrag;

public final class VertragMapper {
    private VertragMapper() {}

    public static VertragDTO toDTO(Vertrag e) {
        return new VertragDTO(
            e.getId(),
            e.getTitel(),
            e.getWert(),
            e.getCurrency(),
            e.getStatus(),
            e.getStartDate(),
            e.getEndDate(),
            e.getNotes(),
            e.getCreatedAt(),
            e.getUpdatedAt(),
            e.getFirma().getId(),
            e.getFirma().getName(),
            e.getKontaktPerson() != null ? e.getKontaktPerson().getId() : null,
            e.getKontaktPerson() != null ? e.getKontaktPerson().getFirstName() + " " + e.getKontaktPerson().getLastName() : null
        );
    }

    public static Vertrag toEntity(VertragCreateDTO dto, Firma firma, Person kontaktPerson) {
        Vertrag e = new Vertrag();
        applyToEntity(dto, e);
        e.setFirma(firma);
        e.setKontaktPerson(kontaktPerson);
        return e;
    }

    public static void applyToEntity(VertragCreateDTO dto, Vertrag e) {
        e.setTitel(dto.titel());
        e.setWert(dto.wert());
        e.setCurrency(dto.currency());
        e.setStatus(dto.status());
        e.setStartDate(dto.startDate());
        e.setEndDate(dto.endDate());
        e.setNotes(dto.notes());
    }
}
