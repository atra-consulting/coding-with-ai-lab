package com.crm.ciam.exception

import java.time.LocalDateTime

data class ErrorResponse(
    val status: Int,
    val message: String,
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val fieldErrors: Map<String, String>? = null
)
