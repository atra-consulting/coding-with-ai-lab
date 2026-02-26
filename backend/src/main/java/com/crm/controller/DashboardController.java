package com.crm.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.AktivitaetDTO;
import com.crm.dto.DashboardStatsDTO;
import com.crm.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStatsDTO getStats() {
        return dashboardService.getStats();
    }

    @GetMapping("/recent-activities")
    public List<AktivitaetDTO> getRecentActivities() {
        return dashboardService.getRecentActivities();
    }

    @GetMapping("/salary-statistics")
    public List<DashboardStatsDTO.DepartmentSalaryDTO> getSalaryStatistics() {
        return dashboardService.getSalaryStatistics();
    }

    @GetMapping("/top-companies")
    public List<DashboardStatsDTO.TopFirmaDTO> getTopCompanies() {
        return dashboardService.getTopCompanies();
    }
}
