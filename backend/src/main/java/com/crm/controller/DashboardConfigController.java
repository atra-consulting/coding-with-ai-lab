package com.crm.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.DashboardConfigDTO;
import com.crm.security.CrmPrincipal;
import com.crm.service.DashboardConfigService;

@RestController
@RequestMapping("/api/dashboard-config")
@PreAuthorize("hasAuthority('DASHBOARD')")
public class DashboardConfigController {

    private final DashboardConfigService dashboardConfigService;

    public DashboardConfigController(DashboardConfigService dashboardConfigService) {
        this.dashboardConfigService = dashboardConfigService;
    }

    @GetMapping
    public ResponseEntity<DashboardConfigDTO> getConfig(Authentication authentication) {
        Long benutzerId = ((CrmPrincipal) authentication.getPrincipal()).benutzerId();
        return dashboardConfigService.getConfig(benutzerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping
    public DashboardConfigDTO saveConfig(Authentication authentication, @RequestBody DashboardConfigDTO dto) {
        Long benutzerId = ((CrmPrincipal) authentication.getPrincipal()).benutzerId();
        return dashboardConfigService.saveConfig(benutzerId, dto);
    }
}
