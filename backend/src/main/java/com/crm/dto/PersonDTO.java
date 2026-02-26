package com.crm.dto;

import java.time.LocalDateTime;

public record PersonDTO(
    Long id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String position,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    Long firmaId,
    String firmaName,
    Long abteilungId,
    String abteilungName
) {}
