package com.crm.dto;

import com.crm.entity.enums.ChancePhase;

import jakarta.validation.constraints.NotNull;

public record PhaseUpdateDTO(@NotNull ChancePhase phase) {}
