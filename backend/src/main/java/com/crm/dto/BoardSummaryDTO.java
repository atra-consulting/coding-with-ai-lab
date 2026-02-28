package com.crm.dto;

import java.math.BigDecimal;

import com.crm.entity.enums.ChancePhase;

public record BoardSummaryDTO(ChancePhase phase, long count, BigDecimal totalWert) {}
