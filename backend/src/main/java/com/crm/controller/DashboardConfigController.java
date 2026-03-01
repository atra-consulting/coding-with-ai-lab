package com.crm.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.DashboardConfigDTO;
import com.crm.entity.Benutzer;
import com.crm.security.BenutzerDetails;
import com.crm.service.DashboardConfigService;

@RestController
@RequestMapping("/api/dashboard-config")
public class DashboardConfigController {

    private final DashboardConfigService dashboardConfigService;

    public DashboardConfigController(DashboardConfigService dashboardConfigService) {
        this.dashboardConfigService = dashboardConfigService;
    }

    @GetMapping
    public ResponseEntity<DashboardConfigDTO> getConfig(Authentication authentication) {
        Benutzer benutzer = ((BenutzerDetails) authentication.getPrincipal()).getBenutzer();
        return dashboardConfigService.getConfig(benutzer.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping
    public DashboardConfigDTO saveConfig(Authentication authentication, @RequestBody DashboardConfigDTO dto) {
        Benutzer benutzer = ((BenutzerDetails) authentication.getPrincipal()).getBenutzer();
        return dashboardConfigService.saveConfig(benutzer, dto);
    }
}
