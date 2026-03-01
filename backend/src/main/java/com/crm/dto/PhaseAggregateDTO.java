package com.crm.dto;

import java.math.BigDecimal;

import com.crm.entity.enums.ChancePhase;

public record PhaseAggregateDTO(
    ChancePhase phase,
    long anzahl,
    BigDecimal summeWert,
    BigDecimal durchschnittWert,
    BigDecimal summeGewichtet
) {}
