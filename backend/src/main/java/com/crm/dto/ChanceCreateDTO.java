package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.crm.entity.enums.ChancePhase;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChanceCreateDTO(
    @NotBlank String titel,
    String beschreibung,
    BigDecimal wert,
    String currency,
    @NotNull ChancePhase phase,
    @Min(0) @Max(100) Integer wahrscheinlichkeit,
    LocalDate erwartetesDatum,
    @NotNull Long firmaId,
    Long kontaktPersonId
) {}
