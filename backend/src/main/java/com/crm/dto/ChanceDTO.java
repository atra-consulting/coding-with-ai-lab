package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.crm.entity.enums.ChancePhase;

public record ChanceDTO(
    Long id,
    String titel,
    String beschreibung,
    BigDecimal wert,
    String currency,
    ChancePhase phase,
    Integer wahrscheinlichkeit,
    LocalDate erwartetesDatum,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    Long firmaId,
    String firmaName,
    Long kontaktPersonId,
    String kontaktPersonName
) {}
