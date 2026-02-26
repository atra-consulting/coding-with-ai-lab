package com.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.crm.entity.enums.GehaltTyp;

public record GehaltDTO(
    Long id,
    BigDecimal amount,
    String currency,
    LocalDate effectiveDate,
    GehaltTyp typ,
    Long personId,
    String personName
) {}
