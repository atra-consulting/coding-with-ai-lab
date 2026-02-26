package com.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AbteilungCreateDTO(
    @NotBlank String name,
    String description,
    @NotNull Long firmaId
) {}
