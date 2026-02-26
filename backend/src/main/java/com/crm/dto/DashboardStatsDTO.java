package com.crm.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStatsDTO(
    long firmenCount,
    long personenCount,
    long aktivitaetenCount,
    long offeneChancenCount,
    BigDecimal gesamtVertragswert,
    BigDecimal durchschnittsGehalt,
    List<AktivitaetDTO> recentAktivitaeten,
    List<TopFirmaDTO> topFirmen,
    List<DepartmentSalaryDTO> salaryByDepartment
) {
    public record TopFirmaDTO(Long id, String name, long personenCount, BigDecimal vertragswert) {}
    public record DepartmentSalaryDTO(String departmentName, BigDecimal averageSalary) {}
}
