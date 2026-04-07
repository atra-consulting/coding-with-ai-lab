package com.crm.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

import com.crm.dto.ProduktCreateDTO;
import com.crm.dto.ProduktDTO;
import com.crm.service.ProduktService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/produkte")
@PreAuthorize("hasAuthority('PRODUKTE')")
public class ProduktController {

    private final ProduktService produktService;

    public ProduktController(ProduktService produktService) {
        this.produktService = produktService;
    }

    @GetMapping("/all")
    public List<ProduktDTO> listAll() {
        return produktService.listAll();
    }

    @GetMapping
    public Page<ProduktDTO> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name,asc") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return produktService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ProduktDTO findById(@PathVariable Long id) {
        return produktService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProduktDTO create(@Valid @RequestBody ProduktCreateDTO dto) {
        return produktService.create(dto);
    }

    @PutMapping("/{id}")
    public ProduktDTO update(@PathVariable Long id, @Valid @RequestBody ProduktCreateDTO dto) {
        return produktService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        produktService.delete(id);
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
