package com.crm.dto;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record BenutzerCreateDTO(
        @NotBlank String benutzername,
        @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein") String passwort,
        @NotBlank String vorname,
        @NotBlank String nachname,
        @NotBlank @Email String email,
        @NotEmpty Set<String> rollen,
        boolean aktiv
) {}
