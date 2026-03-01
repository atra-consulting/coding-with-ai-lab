package com.crm.controller;

import java.util.List;

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

import com.crm.dto.AbteilungCreateDTO;
import com.crm.dto.AbteilungDTO;
import com.crm.service.AbteilungService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/abteilungen")
@PreAuthorize("hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')")
public class AbteilungController {

    private final AbteilungService abteilungService;

    public AbteilungController(AbteilungService abteilungService) {
        this.abteilungService = abteilungService;
    }

    @GetMapping
    public Page<AbteilungDTO> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name,asc") String[] sort) {
        return abteilungService.findAll(PageRequest.of(page, size, parseSort(sort)));
    }

    @GetMapping("/{id}")
    public AbteilungDTO getById(@PathVariable Long id) {
        return abteilungService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AbteilungDTO create(@Valid @RequestBody AbteilungCreateDTO dto) {
        return abteilungService.create(dto);
    }

    @PutMapping("/{id}")
    public AbteilungDTO update(@PathVariable Long id, @Valid @RequestBody AbteilungCreateDTO dto) {
        return abteilungService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        abteilungService.delete(id);
    }

    @GetMapping("/firma/{firmaId}")
    public List<AbteilungDTO> getByFirmaId(@PathVariable Long firmaId) {
        return abteilungService.findAllByFirmaId(firmaId);
    }

    private Sort parseSort(String[] sort) {
        if (sort.length >= 2) {
            return Sort.by(Sort.Direction.fromString(sort[1]), sort[0]);
        }
        return Sort.by(Sort.Direction.ASC, sort[0]);
    }
}
