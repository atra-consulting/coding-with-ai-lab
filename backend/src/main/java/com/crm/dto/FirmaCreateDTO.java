package com.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record FirmaCreateDTO(
    @NotBlank String name,
    String industry,
    String website,
    String phone,
    @Email String email,
    String notes
) {}
