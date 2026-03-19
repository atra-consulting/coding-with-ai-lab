package com.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequestDTO(
    @NotBlank(message = "Nachricht darf nicht leer sein")
    @Size(max = 2000, message = "Nachricht darf maximal 2000 Zeichen lang sein")
    String message
) {}
