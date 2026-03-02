package com.crm.ciam.security

import com.crm.ciam.repository.BenutzerRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class BenutzerDetailsService(
    private val benutzerRepository: BenutzerRepository
) : UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails {
        val benutzer = benutzerRepository.findByBenutzername(username)
            .orElseThrow { UsernameNotFoundException("Benutzer nicht gefunden: $username") }
        return BenutzerDetails(benutzer)
    }
}
