package com.crm.dto;

import java.util.List;

public record LoginResponseDTO(
        String accessToken,
        String benutzername,
        String vorname,
        String nachname,
        List<String> rollen
) {}
