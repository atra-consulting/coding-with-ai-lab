package com.crm.ciam.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.ciam.dto.BenutzerCreateDTO;
import com.crm.ciam.dto.BenutzerDTO;
import com.crm.ciam.entity.Benutzer;
import com.crm.ciam.exception.ResourceNotFoundException;
import com.crm.ciam.mapper.BenutzerMapper;
import com.crm.ciam.repository.BenutzerRepository;
import com.crm.ciam.security.RefreshTokenService;

@Service
@Transactional
public class BenutzerService {

    private final BenutzerRepository benutzerRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public BenutzerService(BenutzerRepository benutzerRepository,
                           PasswordEncoder passwordEncoder,
                           RefreshTokenService refreshTokenService) {
        this.benutzerRepository = benutzerRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional(readOnly = true)
    public Page<BenutzerDTO> findAll(String search, Pageable pageable) {
        Page<Benutzer> page = (search == null || search.isBlank())
                ? benutzerRepository.findAll(pageable)
                : benutzerRepository.search(search, pageable);
        return page.map(BenutzerMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public BenutzerDTO findById(Long id) {
        return BenutzerMapper.toDTO(
                benutzerRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Benutzer", id)));
    }

    public BenutzerDTO create(BenutzerCreateDTO dto) {
        if (benutzerRepository.existsByBenutzername(dto.benutzername())) {
            throw new IllegalArgumentException("Benutzername ist bereits vergeben");
        }
        if (benutzerRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-Mail-Adresse ist bereits vergeben");
        }
        Benutzer benutzer = BenutzerMapper.toEntity(dto, passwordEncoder);
        return BenutzerMapper.toDTO(benutzerRepository.save(benutzer));
    }

    public BenutzerDTO update(Long id, BenutzerCreateDTO dto) {
        Benutzer benutzer = benutzerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", id));

        if (!benutzer.getEmail().equals(dto.email()) && benutzerRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-Mail-Adresse ist bereits vergeben");
        }

        BenutzerMapper.applyToEntity(dto, benutzer, passwordEncoder);

        if (!benutzer.isAktiv()) {
            refreshTokenService.deleteByBenutzer(benutzer);
        }

        return BenutzerMapper.toDTO(benutzerRepository.save(benutzer));
    }

    public BenutzerDTO toggleActive(Long id, String currentUsername) {
        Benutzer benutzer = benutzerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", id));

        if (benutzer.getBenutzername().equals(currentUsername)) {
            throw new IllegalArgumentException("Sie können sich nicht selbst deaktivieren");
        }

        benutzer.setAktiv(!benutzer.isAktiv());

        if (!benutzer.isAktiv()) {
            refreshTokenService.deleteByBenutzer(benutzer);
        }

        return BenutzerMapper.toDTO(benutzerRepository.save(benutzer));
    }
}
