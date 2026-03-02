package com.crm.ciam.security

import com.crm.ciam.entity.Benutzer
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

class BenutzerDetails(val benutzer: Benutzer) : UserDetails {

    override fun getAuthorities(): Collection<GrantedAuthority> =
        benutzer.rollen.map { rolle -> SimpleGrantedAuthority("ROLE_${rolle.name}") }.toSet()

    override fun getPassword(): String = benutzer.passwort

    override fun getUsername(): String = benutzer.benutzername

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = benutzer.aktiv

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = benutzer.aktiv
}
