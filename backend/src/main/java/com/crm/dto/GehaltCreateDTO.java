package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.crm.entity.enums.GehaltTyp;

import jakarta.validation.constraints.NotNull;

public record GehaltCreateDTO(
    @NotNull BigDecimal amount,
    String currency,
    @NotNull LocalDate effectiveDate,
    @NotNull GehaltTyp typ,
    @NotNull Long personId
) {}
