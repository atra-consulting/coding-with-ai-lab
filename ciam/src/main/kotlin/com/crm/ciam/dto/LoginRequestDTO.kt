package com.crm.ciam.dto

import jakarta.validation.constraints.NotBlank

data class LoginRequestDTO(
    @field:NotBlank val benutzername: String,
    @field:NotBlank val passwort: String
)
