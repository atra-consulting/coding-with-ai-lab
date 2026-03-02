package com.crm.ciam.dto

data class BenutzerInfoDTO(
    val id: Long?,
    val benutzername: String,
    val vorname: String,
    val nachname: String,
    val email: String,
    val rollen: List<String>,
    val permissions: List<String>
)
