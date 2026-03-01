package com.crm.dto;

import java.util.List;

import com.crm.entity.enums.ReportDimension;
import com.crm.entity.enums.ReportMetrik;

public record ReportQueryDTO(
        ReportDimension dimension,
        List<ReportMetrik> metriken,
        ReportFilterDTO filter) {
}
