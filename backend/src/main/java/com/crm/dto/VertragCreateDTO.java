package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.crm.entity.enums.VertragStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VertragCreateDTO(
    @NotBlank String titel,
    BigDecimal wert,
    String currency,
    @NotNull VertragStatus status,
    LocalDate startDate,
    LocalDate endDate,
    String notes,
    @NotNull Long firmaId,
    Long kontaktPersonId
) {}
