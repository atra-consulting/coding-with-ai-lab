package com.crm.dto;

import java.math.BigDecimal;

public record TopFirmaDTO(
    Long firmaId,
    String firmaName,
    long anzahlChancen,
    BigDecimal summeWert
) {}
