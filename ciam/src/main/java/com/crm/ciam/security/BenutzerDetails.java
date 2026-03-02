package com.crm.ciam.security;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.crm.ciam.entity.Benutzer;

public class BenutzerDetails implements UserDetails {

    private final Benutzer benutzer;

    public BenutzerDetails(Benutzer benutzer) {
        this.benutzer = benutzer;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return benutzer.getRollen().stream()
                .map(rolle -> new SimpleGrantedAuthority("ROLE_" + rolle.name()))
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return benutzer.getPasswort();
    }

    @Override
    public String getUsername() {
        return benutzer.getBenutzername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return benutzer.isAktiv();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return benutzer.isAktiv();
    }

    public Benutzer getBenutzer() {
        return benutzer;
    }
}
