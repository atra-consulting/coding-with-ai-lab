package com.crm.dto;

public record AbteilungDTO(
    Long id,
    String name,
    String description,
    Long firmaId,
    String firmaName,
    int personenCount
) {}
