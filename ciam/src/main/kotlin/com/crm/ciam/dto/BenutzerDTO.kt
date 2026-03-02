package com.crm.ciam.dto

import java.time.LocalDateTime

data class BenutzerDTO(
    val id: Long?,
    val benutzername: String,
    val vorname: String,
    val nachname: String,
    val email: String,
    val rollen: List<String>,
    val aktiv: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
