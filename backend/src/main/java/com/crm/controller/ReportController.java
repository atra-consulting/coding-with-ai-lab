package com.crm.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.ReportQueryDTO;
import com.crm.dto.ReportResultDTO;
import com.crm.service.ReportService;

@RestController
@RequestMapping("/api/auswertungen")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/report")
    public ReportResultDTO executeReport(@RequestBody ReportQueryDTO query) {
        return reportService.executeReport(query);
    }
}
