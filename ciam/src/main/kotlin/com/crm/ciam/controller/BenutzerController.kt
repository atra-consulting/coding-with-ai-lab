package com.crm.ciam.controller

import com.crm.ciam.dto.BenutzerCreateDTO
import com.crm.ciam.dto.BenutzerDTO
import com.crm.ciam.service.BenutzerService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/benutzer")
@PreAuthorize("hasRole('ADMIN')")
class BenutzerController(
    private val benutzerService: BenutzerService
) {

    @GetMapping("/all")
    fun listAll(): List<BenutzerDTO> =
        benutzerService.listAll()

    @GetMapping
    fun findAll(
        @RequestParam(defaultValue = "") search: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(defaultValue = "benutzername,asc") sort: Array<String>
    ): Page<BenutzerDTO> =
        benutzerService.findAll(search, PageRequest.of(page, size, parseSort(sort)))

    @GetMapping("/{id}")
    fun findById(@PathVariable id: Long): BenutzerDTO =
        benutzerService.findById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody dto: BenutzerCreateDTO): BenutzerDTO =
        benutzerService.create(dto)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @Valid @RequestBody dto: BenutzerCreateDTO): BenutzerDTO =
        benutzerService.update(id, dto)

    @PatchMapping("/{id}/toggle-active")
    fun toggleActive(@PathVariable id: Long, authentication: Authentication): BenutzerDTO =
        benutzerService.toggleActive(id, authentication.name)

    private fun parseSort(sort: Array<String>): Sort {
        if (sort.size == 1 && sort[0].contains(",")) {
            val parts = sort[0].split(",")
            return Sort.by(Sort.Direction.fromString(parts[1].trim()), parts[0].trim())
        }
        if (sort.size == 2) {
            return Sort.by(Sort.Direction.fromString(sort[1].trim()), sort[0].trim())
        }
        return Sort.by(Sort.Direction.ASC, sort[0].trim())
    }
}
