package com.crm.ciam.exception

import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.DisabledException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.LocalDateTime

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleNotFound(ex: ResourceNotFoundException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(404, ex.message!!))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val fieldErrors = mutableMapOf<String, String>()
        ex.bindingResult.fieldErrors.forEach { error ->
            fieldErrors[error.field] = error.defaultMessage ?: ""
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(400, "Validierungsfehler", LocalDateTime.now(), fieldErrors))
    }

    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentials(ex: BadCredentialsException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(401, "Ungültige Anmeldedaten"))

    @ExceptionHandler(DisabledException::class)
    fun handleDisabled(ex: DisabledException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(401, "Benutzerkonto ist deaktiviert"))

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse(403, "Zugriff verweigert"))

    @ExceptionHandler(TokenRefreshException::class)
    fun handleTokenRefresh(ex: TokenRefreshException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(401, ex.message!!))

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(400, ex.message!!))

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrity(ex: DataIntegrityViolationException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse(409, "Der Vorgang konnte nicht ausgefuehrt werden, da ein Datenkonflikt besteht."))

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse(500, "Ein unerwarteter Fehler ist aufgetreten."))
}
