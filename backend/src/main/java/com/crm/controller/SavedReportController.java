package com.crm.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.SavedReportCreateDTO;
import com.crm.dto.SavedReportDTO;
import com.crm.security.CrmPrincipal;
import com.crm.service.SavedReportService;

@RestController
@RequestMapping("/api/saved-reports")
@PreAuthorize("hasAuthority('AUSWERTUNGEN')")
public class SavedReportController {

    private final SavedReportService savedReportService;

    public SavedReportController(SavedReportService savedReportService) {
        this.savedReportService = savedReportService;
    }

    @GetMapping
    public List<SavedReportDTO> getAll(Authentication authentication) {
        Long benutzerId = ((CrmPrincipal) authentication.getPrincipal()).benutzerId();
        return savedReportService.getByBenutzer(benutzerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedReportDTO create(Authentication authentication, @RequestBody SavedReportCreateDTO dto) {
        Long benutzerId = ((CrmPrincipal) authentication.getPrincipal()).benutzerId();
        return savedReportService.create(benutzerId, dto);
    }

    @PutMapping("/{id}")
    public SavedReportDTO update(Authentication authentication, @PathVariable Long id,
            @RequestBody SavedReportCreateDTO dto) {
        Long benutzerId = ((CrmPrincipal) authentication.getPrincipal()).benutzerId();
        return savedReportService.update(id, benutzerId, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable Long id) {
        Long benutzerId = ((CrmPrincipal) authentication.getPrincipal()).benutzerId();
        savedReportService.delete(id, benutzerId);
    }
}
