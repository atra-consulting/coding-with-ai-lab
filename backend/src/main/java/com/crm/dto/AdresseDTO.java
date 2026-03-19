package com.crm.dto;

public record AdresseDTO(
    Long id,
    String street,
    String houseNumber,
    String postalCode,
    String city,
    String country,
    Double latitude,
    Double longitude,
    Long firmaId,
    String firmaName,
    Long personId,
    String personName
) {}
