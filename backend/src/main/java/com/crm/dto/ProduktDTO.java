package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.crm.entity.enums.ProduktKategorie;

public record ProduktDTO(
    Long id,
    String name,
    String beschreibung,
    String produktNummer,
    BigDecimal preis,
    String currency,
    String einheit,
    ProduktKategorie kategorie,
    boolean aktiv,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
