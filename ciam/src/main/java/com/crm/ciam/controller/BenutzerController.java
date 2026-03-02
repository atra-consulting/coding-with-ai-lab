package com.crm.ciam.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.crm.ciam.dto.BenutzerCreateDTO;
import com.crm.ciam.dto.BenutzerDTO;
import com.crm.ciam.service.BenutzerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/benutzer")
@PreAuthorize("hasRole('ADMIN')")
public class BenutzerController {

    private final BenutzerService benutzerService;

    public BenutzerController(BenutzerService benutzerService) {
        this.benutzerService = benutzerService;
    }

    @GetMapping
    public Page<BenutzerDTO> findAll(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "benutzername,asc") String[] sort) {
        return benutzerService.findAll(search, PageRequest.of(page, size, parseSort(sort)));
    }

    @GetMapping("/{id}")
    public BenutzerDTO findById(@PathVariable Long id) {
        return benutzerService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BenutzerDTO create(@Valid @RequestBody BenutzerCreateDTO dto) {
        return benutzerService.create(dto);
    }

    @PutMapping("/{id}")
    public BenutzerDTO update(@PathVariable Long id, @Valid @RequestBody BenutzerCreateDTO dto) {
        return benutzerService.update(id, dto);
    }

    @PatchMapping("/{id}/toggle-active")
    public BenutzerDTO toggleActive(@PathVariable Long id, Authentication authentication) {
        return benutzerService.toggleActive(id, authentication.getName());
    }

    private Sort parseSort(String[] sort) {
        if (sort.length == 1 && sort[0].contains(",")) {
            String[] parts = sort[0].split(",");
            return Sort.by(Sort.Direction.fromString(parts[1].trim()), parts[0].trim());
        }
        if (sort.length == 2) {
            return Sort.by(Sort.Direction.fromString(sort[1].trim()), sort[0].trim());
        }
        return Sort.by(Sort.Direction.ASC, sort[0].trim());
    }
}
