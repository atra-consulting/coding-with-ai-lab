package com.crm.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

import com.crm.dto.GehaltCreateDTO;
import com.crm.dto.GehaltDTO;
import com.crm.service.GehaltService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/gehaelter")
public class GehaltController {

    private final GehaltService gehaltService;

    public GehaltController(GehaltService gehaltService) {
        this.gehaltService = gehaltService;
    }

    @GetMapping
    public Page<GehaltDTO> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "effectiveDate,desc") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return gehaltService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public GehaltDTO findById(@PathVariable Long id) {
        return gehaltService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GehaltDTO create(@Valid @RequestBody GehaltCreateDTO dto) {
        return gehaltService.create(dto);
    }

    @PutMapping("/{id}")
    public GehaltDTO update(@PathVariable Long id, @Valid @RequestBody GehaltCreateDTO dto) {
        return gehaltService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        gehaltService.delete(id);
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
