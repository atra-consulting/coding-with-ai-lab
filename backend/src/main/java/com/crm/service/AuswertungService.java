package com.crm.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.PhaseAggregateDTO;
import com.crm.dto.PipelineKpisDTO;
import com.crm.dto.TopFirmaDTO;
import com.crm.entity.enums.ChancePhase;
import com.crm.repository.ChanceRepository;

@Service
@Transactional(readOnly = true)
public class AuswertungService {

    private static final List<ChancePhase> CLOSED_PHASES = List.of(ChancePhase.GEWONNEN, ChancePhase.VERLOREN);

    private final ChanceRepository chanceRepository;

    public AuswertungService(ChanceRepository chanceRepository) {
        this.chanceRepository = chanceRepository;
    }

    public PipelineKpisDTO getPipelineKpis() {
        BigDecimal gesamtwert = BigDecimal.valueOf(((Number) chanceRepository.sumWertByPhaseNotIn(CLOSED_PHASES)).doubleValue());
        long anzahlOffen = chanceRepository.countByPhaseNotIn(CLOSED_PHASES);
        BigDecimal durchschnittlicherWert = BigDecimal.valueOf(((Number) chanceRepository.avgWert()).doubleValue());

        long gewonnen = chanceRepository.countByPhase(ChancePhase.GEWONNEN);
        long verloren = chanceRepository.countByPhase(ChancePhase.VERLOREN);
        Double gewinnrate = (gewonnen + verloren) > 0
                ? (double) gewonnen / (gewonnen + verloren) * 100.0
                : null;

        return new PipelineKpisDTO(gesamtwert, anzahlOffen, gewinnrate, durchschnittlicherWert);
    }

    public List<PhaseAggregateDTO> getPhaseAggregates() {
        return chanceRepository.getPhaseAggregatesRaw().stream()
                .map(row -> new PhaseAggregateDTO(
                        (ChancePhase) row[0],
                        ((Number) row[1]).longValue(),
                        BigDecimal.valueOf(((Number) row[2]).doubleValue()),
                        BigDecimal.valueOf(((Number) row[3]).doubleValue()),
                        BigDecimal.valueOf(((Number) row[4]).doubleValue())))
                .toList();
    }

    public List<TopFirmaDTO> getTopFirmen(int limit) {
        return chanceRepository.getTopFirmenRaw(CLOSED_PHASES, PageRequest.of(0, limit)).stream()
                .map(row -> new TopFirmaDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        BigDecimal.valueOf(((Number) row[3]).doubleValue())))
                .toList();
    }
}
