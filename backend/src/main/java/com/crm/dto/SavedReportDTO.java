package com.crm.dto;

import java.time.LocalDateTime;

public record SavedReportDTO(
        Long id,
        String name,
        String config,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
