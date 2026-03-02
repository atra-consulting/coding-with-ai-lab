package com.crm.controller;

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

import com.crm.dto.VertragCreateDTO;
import com.crm.dto.VertragDTO;
import com.crm.service.VertragService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vertraege")
@PreAuthorize("hasAuthority('VERTRAEGE')")
public class VertragController {

    private final VertragService vertragService;

    public VertragController(VertragService vertragService) {
        this.vertragService = vertragService;
    }

    @GetMapping
    public Page<VertragDTO> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "titel,asc") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return vertragService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public VertragDTO findById(@PathVariable Long id) {
        return vertragService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VertragDTO create(@Valid @RequestBody VertragCreateDTO dto) {
        return vertragService.create(dto);
    }

    @PutMapping("/{id}")
    public VertragDTO update(@PathVariable Long id, @Valid @RequestBody VertragCreateDTO dto) {
        return vertragService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        vertragService.delete(id);
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
