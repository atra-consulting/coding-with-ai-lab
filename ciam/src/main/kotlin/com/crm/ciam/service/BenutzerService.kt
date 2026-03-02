package com.crm.ciam.service

import com.crm.ciam.dto.BenutzerCreateDTO
import com.crm.ciam.dto.BenutzerDTO
import com.crm.ciam.exception.ResourceNotFoundException
import com.crm.ciam.mapper.BenutzerMapper
import com.crm.ciam.repository.BenutzerRepository
import com.crm.ciam.security.RefreshTokenService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class BenutzerService(
    private val benutzerRepository: BenutzerRepository,
    private val passwordEncoder: PasswordEncoder,
    private val refreshTokenService: RefreshTokenService
) {

    @Transactional(readOnly = true)
    fun findAll(search: String?, pageable: Pageable): Page<BenutzerDTO> {
        val page = if (search.isNullOrBlank()) {
            benutzerRepository.findAll(pageable)
        } else {
            benutzerRepository.search(search, pageable)
        }
        return page.map(BenutzerMapper::toDTO)
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): BenutzerDTO =
        BenutzerMapper.toDTO(
            benutzerRepository.findById(id)
                .orElseThrow { ResourceNotFoundException("Benutzer", id) }
        )

    fun create(dto: BenutzerCreateDTO): BenutzerDTO {
        if (benutzerRepository.existsByBenutzername(dto.benutzername)) {
            throw IllegalArgumentException("Benutzername ist bereits vergeben")
        }
        if (benutzerRepository.existsByEmail(dto.email)) {
            throw IllegalArgumentException("E-Mail-Adresse ist bereits vergeben")
        }
        val benutzer = BenutzerMapper.toEntity(dto, passwordEncoder)
        return BenutzerMapper.toDTO(benutzerRepository.save(benutzer))
    }

    fun update(id: Long, dto: BenutzerCreateDTO): BenutzerDTO {
        val benutzer = benutzerRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Benutzer", id) }

        if (benutzer.email != dto.email && benutzerRepository.existsByEmail(dto.email)) {
            throw IllegalArgumentException("E-Mail-Adresse ist bereits vergeben")
        }

        BenutzerMapper.applyToEntity(dto, benutzer, passwordEncoder)

        if (!benutzer.aktiv) {
            refreshTokenService.deleteByBenutzer(benutzer)
        }

        return BenutzerMapper.toDTO(benutzerRepository.save(benutzer))
    }

    fun toggleActive(id: Long, currentUsername: String): BenutzerDTO {
        val benutzer = benutzerRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Benutzer", id) }

        if (benutzer.benutzername == currentUsername) {
            throw IllegalArgumentException("Sie können sich nicht selbst deaktivieren")
        }

        benutzer.aktiv = !benutzer.aktiv

        if (!benutzer.aktiv) {
            refreshTokenService.deleteByBenutzer(benutzer)
        }

        return BenutzerMapper.toDTO(benutzerRepository.save(benutzer))
    }
}
