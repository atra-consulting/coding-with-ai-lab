package com.crm.dto;

import java.time.LocalDateTime;

public record FirmaDTO(
    Long id,
    String name,
    String industry,
    String website,
    String phone,
    String email,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    int personenCount,
    int abteilungenCount
) {}
