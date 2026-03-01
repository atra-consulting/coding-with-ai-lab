package com.crm.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
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
import com.crm.entity.Benutzer;
import com.crm.security.BenutzerDetails;
import com.crm.service.SavedReportService;

@RestController
@RequestMapping("/api/saved-reports")
public class SavedReportController {

    private final SavedReportService savedReportService;

    public SavedReportController(SavedReportService savedReportService) {
        this.savedReportService = savedReportService;
    }

    @GetMapping
    public List<SavedReportDTO> getAll(Authentication authentication) {
        Benutzer benutzer = ((BenutzerDetails) authentication.getPrincipal()).getBenutzer();
        return savedReportService.getByBenutzer(benutzer.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedReportDTO create(Authentication authentication, @RequestBody SavedReportCreateDTO dto) {
        Benutzer benutzer = ((BenutzerDetails) authentication.getPrincipal()).getBenutzer();
        return savedReportService.create(benutzer, dto);
    }

    @PutMapping("/{id}")
    public SavedReportDTO update(Authentication authentication, @PathVariable Long id,
            @RequestBody SavedReportCreateDTO dto) {
        Benutzer benutzer = ((BenutzerDetails) authentication.getPrincipal()).getBenutzer();
        return savedReportService.update(id, benutzer.getId(), dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable Long id) {
        Benutzer benutzer = ((BenutzerDetails) authentication.getPrincipal()).getBenutzer();
        savedReportService.delete(id, benutzer.getId());
    }
}
