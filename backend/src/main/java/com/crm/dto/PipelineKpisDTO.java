package com.crm.dto;

import java.math.BigDecimal;

public record PipelineKpisDTO(
    BigDecimal gesamtwert,
    long anzahlOffen,
    Double gewinnrate,
    BigDecimal durchschnittlicherWert
) {}
