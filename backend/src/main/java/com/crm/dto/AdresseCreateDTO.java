package com.crm.dto;

import jakarta.validation.constraints.NotBlank;

public record AdresseCreateDTO(
    @NotBlank String street,
    String houseNumber,
    @NotBlank String postalCode,
    @NotBlank String city,
    String country,
    Double latitude,
    Double longitude,
    Long firmaId,
    Long personId
) {}
