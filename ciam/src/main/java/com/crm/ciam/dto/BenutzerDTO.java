package com.crm.ciam.dto;

import java.time.LocalDateTime;
import java.util.List;

public record BenutzerDTO(
        Long id,
        String benutzername,
        String vorname,
        String nachname,
        String email,
        List<String> rollen,
        boolean aktiv,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
