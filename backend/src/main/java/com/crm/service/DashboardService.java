package com.crm.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.AktivitaetDTO;
import com.crm.dto.DashboardStatsDTO;
import com.crm.entity.enums.ChancePhase;
import com.crm.mapper.AktivitaetMapper;
import com.crm.repository.AktivitaetRepository;
import com.crm.repository.ChanceRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.GehaltRepository;
import com.crm.repository.PersonRepository;
import com.crm.repository.VertragRepository;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final FirmaRepository firmaRepository;
    private final PersonRepository personRepository;
    private final AktivitaetRepository aktivitaetRepository;
    private final ChanceRepository chanceRepository;
    private final VertragRepository vertragRepository;
    private final GehaltRepository gehaltRepository;

    public DashboardService(FirmaRepository firmaRepository,
                            PersonRepository personRepository,
                            AktivitaetRepository aktivitaetRepository,
                            ChanceRepository chanceRepository,
                            VertragRepository vertragRepository,
                            GehaltRepository gehaltRepository) {
        this.firmaRepository = firmaRepository;
        this.personRepository = personRepository;
        this.aktivitaetRepository = aktivitaetRepository;
        this.chanceRepository = chanceRepository;
        this.vertragRepository = vertragRepository;
        this.gehaltRepository = gehaltRepository;
    }

    public DashboardStatsDTO getStats() {
        long firmenCount = firmaRepository.count();
        long personenCount = personRepository.count();
        long aktivitaetenCount = aktivitaetRepository.count();
        long offeneChancen = chanceRepository.countByPhaseNotIn(
                List.of(ChancePhase.GEWONNEN, ChancePhase.VERLOREN));
        BigDecimal gesamtVertragswert = toBigDecimal(vertragRepository.findTotalActiveVertragswert());
        BigDecimal durchschnittsGehalt = toBigDecimal(gehaltRepository.findAverageGrundgehalt());

        List<AktivitaetDTO> recent = aktivitaetRepository.findTop10ByOrderByDatumDesc()
                .stream().map(AktivitaetMapper::toDTO).toList();

        List<Object[]> topRaw = vertragRepository.findTopFirmenByVertragswert();
        List<DashboardStatsDTO.TopFirmaDTO> topFirmen = topRaw.stream()
                .limit(5)
                .map(row -> new DashboardStatsDTO.TopFirmaDTO(
                        (Long) row[0], (String) row[1],
                        personRepository.countByFirmaId((Long) row[0]),
                        toBigDecimal(row[2])
                )).toList();

        List<Object[]> salaryRaw = gehaltRepository.findAverageSalaryByDepartment();
        List<DashboardStatsDTO.DepartmentSalaryDTO> salaryByDept = salaryRaw.stream()
                .limit(5)
                .map(row -> new DashboardStatsDTO.DepartmentSalaryDTO(
                        (String) row[0], toBigDecimal(row[1])
                )).toList();

        return new DashboardStatsDTO(firmenCount, personenCount, aktivitaetenCount,
                offeneChancen, gesamtVertragswert, durchschnittsGehalt,
                recent, topFirmen, salaryByDept);
    }

    public List<AktivitaetDTO> getRecentActivities() {
        return aktivitaetRepository.findTop10ByOrderByDatumDesc()
                .stream().map(AktivitaetMapper::toDTO).toList();
    }

    public List<DashboardStatsDTO.DepartmentSalaryDTO> getSalaryStatistics() {
        return gehaltRepository.findAverageSalaryByDepartment().stream()
                .limit(5)
                .map(row -> new DashboardStatsDTO.DepartmentSalaryDTO(
                        (String) row[0], toBigDecimal(row[1])))
                .toList();
    }

    public List<DashboardStatsDTO.TopFirmaDTO> getTopCompanies() {
        return vertragRepository.findTopFirmenByVertragswert().stream()
                .limit(5)
                .map(row -> new DashboardStatsDTO.TopFirmaDTO(
                        (Long) row[0], (String) row[1],
                        personRepository.countByFirmaId((Long) row[0]),
                        toBigDecimal(row[2])
                )).toList();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }
}
