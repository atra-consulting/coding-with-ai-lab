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

import com.crm.dto.BoardSummaryDTO;
import com.crm.dto.ChanceCreateDTO;
import com.crm.dto.ChanceDTO;
import com.crm.dto.PhaseUpdateDTO;
import com.crm.entity.enums.ChancePhase;
import com.crm.service.ChanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chancen")
@PreAuthorize("hasAnyRole('ADMIN', 'VERTRIEB')")
public class ChanceController {

    private final ChanceService chanceService;

    public ChanceController(ChanceService chanceService) {
        this.chanceService = chanceService;
    }

    @GetMapping
    public Page<ChanceDTO> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "titel,asc") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return chanceService.findAll(pageable);
    }

    @GetMapping("/board/summary")
    public List<BoardSummaryDTO> getBoardSummary() {
        return chanceService.getBoardSummary();
    }

    @GetMapping("/phase/{phase}")
    public Page<ChanceDTO> findByPhase(
            @PathVariable ChancePhase phase,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "wert,desc") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return chanceService.findByPhase(phase, pageable);
    }

    @PutMapping("/{id}/phase")
    public ChanceDTO updatePhase(@PathVariable Long id, @Valid @RequestBody PhaseUpdateDTO dto) {
        return chanceService.updatePhase(id, dto.phase());
    }

    @GetMapping("/{id}")
    public ChanceDTO findById(@PathVariable Long id) {
        return chanceService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChanceDTO create(@Valid @RequestBody ChanceCreateDTO dto) {
        return chanceService.create(dto);
    }

    @PutMapping("/{id}")
    public ChanceDTO update(@PathVariable Long id, @Valid @RequestBody ChanceCreateDTO dto) {
        return chanceService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        chanceService.delete(id);
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
