package com.crm.ciam.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.crm.ciam.entity.Benutzer;
import com.crm.ciam.repository.BenutzerRepository;

@Service
public class BenutzerDetailsService implements UserDetailsService {

    private final BenutzerRepository benutzerRepository;

    public BenutzerDetailsService(BenutzerRepository benutzerRepository) {
        this.benutzerRepository = benutzerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Benutzer benutzer = benutzerRepository.findByBenutzername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Benutzer nicht gefunden: " + username));
        return new BenutzerDetails(benutzer);
    }
}
