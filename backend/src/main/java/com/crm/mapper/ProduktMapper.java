package com.crm.mapper;

import com.crm.dto.ProduktCreateDTO;
import com.crm.dto.ProduktDTO;
import com.crm.entity.Produkt;

public final class ProduktMapper {
    private ProduktMapper() {}

    public static ProduktDTO toDTO(Produkt e) {
        return new ProduktDTO(
            e.getId(),
            e.getName(),
            e.getBeschreibung(),
            e.getProduktNummer(),
            e.getPreis(),
            e.getCurrency(),
            e.getEinheit(),
            e.getKategorie(),
            e.isAktiv(),
            e.getCreatedAt(),
            e.getUpdatedAt()
        );
    }

    public static Produkt toEntity(ProduktCreateDTO dto) {
        Produkt e = new Produkt();
        applyToEntity(dto, e);
        return e;
    }

    public static void applyToEntity(ProduktCreateDTO dto, Produkt e) {
        e.setName(dto.name());
        e.setBeschreibung(dto.beschreibung());
        e.setProduktNummer(dto.produktNummer());
        e.setPreis(dto.preis());
        e.setCurrency(dto.currency());
        e.setEinheit(dto.einheit());
        e.setKategorie(dto.kategorie());
        if (dto.aktiv() != null) {
            e.setAktiv(dto.aktiv());
        }
    }
}
