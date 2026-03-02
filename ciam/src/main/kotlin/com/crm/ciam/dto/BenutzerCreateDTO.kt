package com.crm.ciam.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size

data class BenutzerCreateDTO(
    @field:NotBlank val benutzername: String,
    @field:Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein") val passwort: String?,
    @field:NotBlank val vorname: String,
    @field:NotBlank val nachname: String,
    @field:NotBlank @field:Email val email: String,
    @field:NotEmpty val rollen: Set<String>,
    val aktiv: Boolean
)
