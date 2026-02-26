package com.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PersonCreateDTO(
    @NotBlank String firstName,
    @NotBlank String lastName,
    String email,
    String phone,
    String position,
    String notes,
    @NotNull Long firmaId,
    Long abteilungId
) {}
