package com.crm.mapper;

import com.crm.dto.AdresseCreateDTO;
import com.crm.dto.AdresseDTO;
import com.crm.entity.Adresse;
import com.crm.entity.Firma;
import com.crm.entity.Person;

public final class AdresseMapper {
    private AdresseMapper() {}

    public static AdresseDTO toDTO(Adresse e) {
        return new AdresseDTO(
            e.getId(),
            e.getStreet(),
            e.getHouseNumber(),
            e.getPostalCode(),
            e.getCity(),
            e.getCountry(),
            e.getLatitude(),
            e.getLongitude(),
            e.getFirma() != null ? e.getFirma().getId() : null,
            e.getFirma() != null ? e.getFirma().getName() : null,
            e.getPerson() != null ? e.getPerson().getId() : null,
            e.getPerson() != null ? e.getPerson().getFirstName() + " " + e.getPerson().getLastName() : null
        );
    }

    public static Adresse toEntity(AdresseCreateDTO dto, Firma firma, Person person) {
        Adresse e = new Adresse();
        applyToEntity(dto, e);
        e.setFirma(firma);
        e.setPerson(person);
        return e;
    }

    public static void applyToEntity(AdresseCreateDTO dto, Adresse e) {
        e.setStreet(dto.street());
        e.setHouseNumber(dto.houseNumber());
        e.setPostalCode(dto.postalCode());
        e.setCity(dto.city());
        e.setCountry(dto.country());
        e.setLatitude(dto.latitude());
        e.setLongitude(dto.longitude());
    }
}
