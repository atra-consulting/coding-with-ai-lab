package com.crm.ciam.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
        @NotBlank String benutzername,
        @NotBlank String passwort
) {}
