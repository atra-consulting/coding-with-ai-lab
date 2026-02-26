package com.crm.dto;

import java.time.LocalDateTime;

import com.crm.entity.enums.AktivitaetTyp;

public record AktivitaetDTO(
    Long id,
    AktivitaetTyp typ,
    String subject,
    String description,
    LocalDateTime datum,
    LocalDateTime createdAt,
    Long firmaId,
    String firmaName,
    Long personId,
    String personName
) {}
