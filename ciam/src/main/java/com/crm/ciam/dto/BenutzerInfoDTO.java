package com.crm.ciam.dto;

import java.util.List;

public record BenutzerInfoDTO(
        Long id,
        String benutzername,
        String vorname,
        String nachname,
        String email,
        List<String> rollen,
        List<String> permissions
) {}
