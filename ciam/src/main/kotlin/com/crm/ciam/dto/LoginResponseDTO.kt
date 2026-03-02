package com.crm.ciam.dto

data class LoginResponseDTO(
    val accessToken: String,
    val benutzername: String,
    val vorname: String,
    val nachname: String,
    val rollen: List<String>
)
