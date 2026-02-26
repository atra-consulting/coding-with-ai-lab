package com.crm.mapper;

import com.crm.dto.GehaltCreateDTO;
import com.crm.dto.GehaltDTO;
import com.crm.entity.Gehalt;
import com.crm.entity.Person;

public final class GehaltMapper {
    private GehaltMapper() {}

    public static GehaltDTO toDTO(Gehalt e) {
        return new GehaltDTO(
            e.getId(),
            e.getAmount(),
            e.getCurrency(),
            e.getEffectiveDate(),
            e.getTyp(),
            e.getPerson().getId(),
            e.getPerson().getFirstName() + " " + e.getPerson().getLastName()
        );
    }

    public static Gehalt toEntity(GehaltCreateDTO dto, Person person) {
        Gehalt e = new Gehalt();
        applyToEntity(dto, e);
        e.setPerson(person);
        return e;
    }

    public static void applyToEntity(GehaltCreateDTO dto, Gehalt e) {
        e.setAmount(dto.amount());
        e.setCurrency(dto.currency());
        e.setEffectiveDate(dto.effectiveDate());
        e.setTyp(dto.typ());
    }
}
