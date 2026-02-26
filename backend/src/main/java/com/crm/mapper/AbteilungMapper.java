package com.crm.mapper;

import com.crm.dto.AbteilungCreateDTO;
import com.crm.dto.AbteilungDTO;
import com.crm.entity.Abteilung;
import com.crm.entity.Firma;

public final class AbteilungMapper {
    private AbteilungMapper() {}

    public static AbteilungDTO toDTO(Abteilung e) {
        return new AbteilungDTO(
            e.getId(),
            e.getName(),
            e.getDescription(),
            e.getFirma().getId(),
            e.getFirma().getName(),
            e.getPersonen().size()
        );
    }

    public static Abteilung toEntity(AbteilungCreateDTO dto, Firma firma) {
        Abteilung e = new Abteilung();
        applyToEntity(dto, e);
        e.setFirma(firma);
        return e;
    }

    public static void applyToEntity(AbteilungCreateDTO dto, Abteilung e) {
        e.setName(dto.name());
        e.setDescription(dto.description());
    }
}
