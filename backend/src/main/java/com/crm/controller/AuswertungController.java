package com.crm.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crm.dto.PhaseAggregateDTO;
import com.crm.dto.PipelineKpisDTO;
import com.crm.dto.TopFirmaDTO;
import com.crm.service.AuswertungService;

@RestController
@RequestMapping("/api/auswertungen")
public class AuswertungController {

    private final AuswertungService auswertungService;

    public AuswertungController(AuswertungService auswertungService) {
        this.auswertungService = auswertungService;
    }

    @GetMapping("/pipeline/kpis")
    public PipelineKpisDTO getPipelineKpis() {
        return auswertungService.getPipelineKpis();
    }

    @GetMapping("/pipeline/by-phase")
    public List<PhaseAggregateDTO> getPhaseAggregates() {
        return auswertungService.getPhaseAggregates();
    }

    @GetMapping("/pipeline/top-firmen")
    public List<TopFirmaDTO> getTopFirmen(@RequestParam(defaultValue = "10") int limit) {
        return auswertungService.getTopFirmen(limit);
    }
}
