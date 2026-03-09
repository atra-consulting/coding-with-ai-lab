package com.crm.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.crm.dto.AbteilungDTO;
import com.crm.dto.AdresseDTO;
import com.crm.dto.FirmaCreateDTO;
import com.crm.dto.FirmaDTO;
import com.crm.dto.PersonDTO;
import com.crm.service.AbteilungService;
import com.crm.service.AdresseService;
import com.crm.service.FirmaService;
import com.crm.service.PersonService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/firmen")
@PreAuthorize("hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')")
public class FirmaController {

    private final FirmaService firmaService;
    private final PersonService personService;
    private final AbteilungService abteilungService;
    private final AdresseService adresseService;

    public FirmaController(FirmaService firmaService, PersonService personService, AbteilungService abteilungService, AdresseService adresseService) {
        this.firmaService = firmaService;
        this.personService = personService;
        this.abteilungService = abteilungService;
        this.adresseService = adresseService;
    }

    @GetMapping("/all")
    public List<FirmaDTO> listAll() {
        return firmaService.listAll();
    }

    @GetMapping
    public Page<FirmaDTO> getAll(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name,asc") String[] sort) {
        return firmaService.findAll(search, PageRequest.of(page, size, parseSort(sort)));
    }

    @GetMapping("/{id}")
    public FirmaDTO getById(@PathVariable Long id) {
        return firmaService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FirmaDTO create(@Valid @RequestBody FirmaCreateDTO dto) {
        return firmaService.create(dto);
    }

    @PutMapping("/{id}")
    public FirmaDTO update(@PathVariable Long id, @Valid @RequestBody FirmaCreateDTO dto) {
        return firmaService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        firmaService.delete(id);
    }

    @GetMapping("/{id}/personen")
    public Page<PersonDTO> getPersonen(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return personService.findByFirmaId(id, PageRequest.of(page, size));
    }

    @GetMapping("/{id}/abteilungen")
    public Page<AbteilungDTO> getAbteilungen(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return abteilungService.findByFirmaId(id, PageRequest.of(page, size));
    }

    @GetMapping("/{id}/adressen")
    public Page<AdresseDTO> getAdressen(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return adresseService.findByFirmaId(id, PageRequest.of(page, size));
    }

    private Sort parseSort(String[] sort) {
        if (sort.length >= 2) {
            return Sort.by(Sort.Direction.fromString(sort[1]), sort[0]);
        }
        return Sort.by(Sort.Direction.ASC, sort[0]);
    }
}
