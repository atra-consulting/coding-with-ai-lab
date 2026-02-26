package com.crm.dto;

public record AdresseDTO(
    Long id,
    String street,
    String houseNumber,
    String postalCode,
    String city,
    String country,
    Long firmaId,
    String firmaName,
    Long personId,
    String personName
) {}
