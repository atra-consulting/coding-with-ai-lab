package com.crm.dto;

import java.util.Map;

public record ReportZeileDTO(
        String label,
        Long id,
        Map<String, Number> werte) {
}
