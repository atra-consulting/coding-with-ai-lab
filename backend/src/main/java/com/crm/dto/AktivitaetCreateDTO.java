package com.crm.dto;

import java.time.LocalDateTime;

import com.crm.entity.enums.AktivitaetTyp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AktivitaetCreateDTO(
    @NotNull AktivitaetTyp typ,
    @NotBlank String subject,
    String description,
    @NotNull LocalDateTime datum,
    Long firmaId,
    Long personId
) {}
