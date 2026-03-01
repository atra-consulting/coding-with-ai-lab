package com.crm.dto;

import java.time.LocalDate;
import java.util.List;

import com.crm.entity.enums.ChancePhase;

public record ReportFilterDTO(
        List<ChancePhase> phasen,
        LocalDate datumVon,
        LocalDate datumBis) {
}
