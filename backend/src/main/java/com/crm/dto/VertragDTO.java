package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.crm.entity.enums.VertragStatus;

public record VertragDTO(
    Long id,
    String titel,
    BigDecimal wert,
    String currency,
    VertragStatus status,
    LocalDate startDate,
    LocalDate endDate,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    Long firmaId,
    String firmaName,
    Long kontaktPersonId,
    String kontaktPersonName
) {}
