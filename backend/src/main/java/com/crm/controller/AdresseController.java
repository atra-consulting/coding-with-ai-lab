package com.crm.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.AdresseCreateDTO;
import com.crm.dto.AdresseDTO;
import com.crm.service.AdresseService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/adressen")
@PreAuthorize("hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')")
public class AdresseController {

    private final AdresseService adresseService;

    public AdresseController(AdresseService adresseService) {
        this.adresseService = adresseService;
    }

    @GetMapping
    public Page<AdresseDTO> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "city,asc") String[] sort) {
        return adresseService.findAll(PageRequest.of(page, size, parseSort(sort)));
    }

    @GetMapping("/{id}")
    public AdresseDTO getById(@PathVariable Long id) {
        return adresseService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdresseDTO create(@Valid @RequestBody AdresseCreateDTO dto) {
        return adresseService.create(dto);
    }

    @PutMapping("/{id}")
    public AdresseDTO update(@PathVariable Long id, @Valid @RequestBody AdresseCreateDTO dto) {
        return adresseService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        adresseService.delete(id);
    }

    private Sort parseSort(String[] sort) {
        if (sort.length >= 2) {
            return Sort.by(Sort.Direction.fromString(sort[1]), sort[0]);
        }
        return Sort.by(Sort.Direction.ASC, sort[0]);
    }
}
