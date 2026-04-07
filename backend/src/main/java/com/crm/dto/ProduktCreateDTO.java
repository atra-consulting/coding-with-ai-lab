package com.crm.dto;

import java.math.BigDecimal;

import com.crm.entity.enums.ProduktKategorie;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProduktCreateDTO(
    @NotBlank String name,
    String beschreibung,
    String produktNummer,
    BigDecimal preis,
    String currency,
    String einheit,
    @NotNull ProduktKategorie kategorie,
    Boolean aktiv
) {}
