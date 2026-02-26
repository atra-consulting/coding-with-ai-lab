package com.crm.mapper;

import com.crm.dto.FirmaCreateDTO;
import com.crm.dto.FirmaDTO;
import com.crm.entity.Firma;

public final class FirmaMapper {
    private FirmaMapper() {}

    public static FirmaDTO toDTO(Firma e) {
        return new FirmaDTO(
            e.getId(),
            e.getName(),
            e.getIndustry(),
            e.getWebsite(),
            e.getPhone(),
            e.getEmail(),
            e.getNotes(),
            e.getCreatedAt(),
            e.getUpdatedAt(),
            e.getPersonen().size(),
            e.getAbteilungen().size()
        );
    }

    public static Firma toEntity(FirmaCreateDTO dto) {
        Firma e = new Firma();
        applyToEntity(dto, e);
        return e;
    }

    public static void applyToEntity(FirmaCreateDTO dto, Firma e) {
        e.setName(dto.name());
        e.setIndustry(dto.industry());
        e.setWebsite(dto.website());
        e.setPhone(dto.phone());
        e.setEmail(dto.email());
        e.setNotes(dto.notes());
    }
}
