package com.crm.mapper;

import com.crm.dto.ChanceCreateDTO;
import com.crm.dto.ChanceDTO;
import com.crm.entity.Chance;
import com.crm.entity.Firma;
import com.crm.entity.Person;

public final class ChanceMapper {
    private ChanceMapper() {}

    public static ChanceDTO toDTO(Chance e) {
        return new ChanceDTO(
            e.getId(),
            e.getTitel(),
            e.getBeschreibung(),
            e.getWert(),
            e.getCurrency(),
            e.getPhase(),
            e.getWahrscheinlichkeit(),
            e.getErwartetesDatum(),
            e.getCreatedAt(),
            e.getUpdatedAt(),
            e.getFirma().getId(),
            e.getFirma().getName(),
            e.getKontaktPerson() != null ? e.getKontaktPerson().getId() : null,
            e.getKontaktPerson() != null ? e.getKontaktPerson().getFirstName() + " " + e.getKontaktPerson().getLastName() : null
        );
    }

    public static Chance toEntity(ChanceCreateDTO dto, Firma firma, Person kontaktPerson) {
        Chance e = new Chance();
        applyToEntity(dto, e);
        e.setFirma(firma);
        e.setKontaktPerson(kontaktPerson);
        return e;
    }

    public static void applyToEntity(ChanceCreateDTO dto, Chance e) {
        e.setTitel(dto.titel());
        e.setBeschreibung(dto.beschreibung());
        e.setWert(dto.wert());
        e.setCurrency(dto.currency());
        e.setPhase(dto.phase());
        e.setWahrscheinlichkeit(dto.wahrscheinlichkeit());
        e.setErwartetesDatum(dto.erwartetesDatum());
    }
}
