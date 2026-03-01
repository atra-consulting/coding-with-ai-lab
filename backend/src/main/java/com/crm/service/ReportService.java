package com.crm.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.ReportFilterDTO;
import com.crm.dto.ReportQueryDTO;
import com.crm.dto.ReportResultDTO;
import com.crm.dto.ReportZeileDTO;
import com.crm.entity.enums.ChancePhase;
import com.crm.entity.enums.ReportDimension;
import com.crm.entity.enums.ReportMetrik;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final EntityManager entityManager;

    public ReportService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public ReportResultDTO executeReport(ReportQueryDTO query) {
        List<ReportMetrik> metriken = query.metriken();
        ReportDimension dimension = query.dimension();
        ReportFilterDTO filter = query.filter();

        boolean hasGewinnrate = metriken.contains(ReportMetrik.GEWINNRATE);
        List<ReportMetrik> aggregateMetriken = metriken.stream()
                .filter(m -> m != ReportMetrik.GEWINNRATE)
                .toList();

        String jpql = buildQuery(dimension, aggregateMetriken, filter);
        Query jpaQuery = entityManager.createQuery(jpql);
        setParameters(jpaQuery, filter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = jpaQuery.getResultList();

        List<ReportZeileDTO> zeilen = new ArrayList<>();
        for (Object[] row : rows) {
            String label = buildLabel(row, dimension);
            Long id = buildId(row, dimension);

            int offset = dimensionColumnCount(dimension);
            Map<String, Number> werte = new LinkedHashMap<>();

            int metrikIdx = 0;
            for (ReportMetrik metrik : aggregateMetriken) {
                Number val = row[offset + metrikIdx] != null
                        ? BigDecimal.valueOf(((Number) row[offset + metrikIdx]).doubleValue())
                        : null;
                werte.put(metrik.name(), val);
                metrikIdx++;
            }

            zeilen.add(new ReportZeileDTO(label, id, werte));
        }

        if (hasGewinnrate) {
            calculateGewinnrate(zeilen, dimension, filter);
        }

        return new ReportResultDTO(dimension, metriken, zeilen);
    }

    private String buildQuery(ReportDimension dimension, List<ReportMetrik> metriken,
            ReportFilterDTO filter) {
        StringBuilder sb = new StringBuilder("SELECT ");
        sb.append(dimensionSelect(dimension));

        for (ReportMetrik metrik : metriken) {
            sb.append(", ").append(metrikSelect(metrik));
        }

        sb.append(" FROM Chance c");
        sb.append(" LEFT JOIN c.firma f");
        sb.append(" LEFT JOIN c.kontaktPerson p");
        sb.append(whereClause(filter, dimension));
        sb.append(" GROUP BY ").append(dimensionGroupBy(dimension));
        sb.append(" ORDER BY ").append(dimensionOrderBy(dimension));

        return sb.toString();
    }

    private String dimensionSelect(ReportDimension dimension) {
        return switch (dimension) {
            case PHASE -> "c.phase";
            case FIRMA -> "f.id, f.name";
            case PERSON -> "p.id, p.firstName, p.lastName";
            case MONAT -> "YEAR(c.erwartetesDatum), MONTH(c.erwartetesDatum)";
            case QUARTAL -> "YEAR(c.erwartetesDatum), QUARTER(c.erwartetesDatum)";
            case JAHR -> "YEAR(c.erwartetesDatum)";
        };
    }

    private String dimensionGroupBy(ReportDimension dimension) {
        return switch (dimension) {
            case PHASE -> "c.phase";
            case FIRMA -> "f.id, f.name";
            case PERSON -> "p.id, p.firstName, p.lastName";
            case MONAT -> "YEAR(c.erwartetesDatum), MONTH(c.erwartetesDatum)";
            case QUARTAL -> "YEAR(c.erwartetesDatum), QUARTER(c.erwartetesDatum)";
            case JAHR -> "YEAR(c.erwartetesDatum)";
        };
    }

    private String dimensionOrderBy(ReportDimension dimension) {
        return switch (dimension) {
            case PHASE -> "c.phase";
            case FIRMA -> "f.name";
            case PERSON -> "p.lastName, p.firstName";
            case MONAT -> "YEAR(c.erwartetesDatum), MONTH(c.erwartetesDatum)";
            case QUARTAL -> "YEAR(c.erwartetesDatum), QUARTER(c.erwartetesDatum)";
            case JAHR -> "YEAR(c.erwartetesDatum)";
        };
    }

    private int dimensionColumnCount(ReportDimension dimension) {
        return switch (dimension) {
            case PHASE, JAHR -> 1;
            case FIRMA, MONAT, QUARTAL -> 2;
            case PERSON -> 3;
        };
    }

    private String metrikSelect(ReportMetrik metrik) {
        return switch (metrik) {
            case ANZAHL -> "COUNT(c)";
            case SUMME_WERT -> "SUM(c.wert)";
            case DURCHSCHNITT_WERT -> "AVG(c.wert)";
            case GEWICHTETER_WERT -> "SUM(c.wert * c.wahrscheinlichkeit / 100.0)";
            case GEWINNRATE -> throw new IllegalArgumentException("GEWINNRATE is handled separately");
        };
    }

    private String whereClause(ReportFilterDTO filter, ReportDimension dimension) {
        List<String> conditions = new ArrayList<>();

        // Exclude NULLs for nullable dimension columns
        if (dimension == ReportDimension.PERSON) {
            conditions.add("c.kontaktPerson IS NOT NULL");
        } else if (dimension == ReportDimension.MONAT || dimension == ReportDimension.QUARTAL
                || dimension == ReportDimension.JAHR) {
            conditions.add("c.erwartetesDatum IS NOT NULL");
        }

        if (filter != null) {
            if (filter.phasen() != null && !filter.phasen().isEmpty()) {
                conditions.add("c.phase IN :phasen");
            }
            if (filter.datumVon() != null) {
                conditions.add("c.erwartetesDatum >= :datumVon");
            }
            if (filter.datumBis() != null) {
                conditions.add("c.erwartetesDatum <= :datumBis");
            }
        }

        if (conditions.isEmpty()) {
            return "";
        }

        return " WHERE " + String.join(" AND ", conditions);
    }

    private void setParameters(Query jpaQuery, ReportFilterDTO filter) {
        if (filter == null) {
            return;
        }

        if (filter.phasen() != null && !filter.phasen().isEmpty()) {
            jpaQuery.setParameter("phasen", filter.phasen());
        }
        if (filter.datumVon() != null) {
            jpaQuery.setParameter("datumVon", filter.datumVon());
        }
        if (filter.datumBis() != null) {
            jpaQuery.setParameter("datumBis", filter.datumBis());
        }
    }

    private String buildLabel(Object[] row, ReportDimension dimension) {
        return switch (dimension) {
            case PHASE -> ((ChancePhase) row[0]).name();
            case FIRMA -> (String) row[1];
            case PERSON -> row[1] + " " + row[2];
            case MONAT -> String.format("%d-%02d", ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
            case QUARTAL -> String.format("Q%d %d", ((Number) row[1]).intValue(), ((Number) row[0]).intValue());
            case JAHR -> String.valueOf(((Number) row[0]).intValue());
        };
    }

    private Long buildId(Object[] row, ReportDimension dimension) {
        return switch (dimension) {
            case FIRMA -> row[0] != null ? ((Number) row[0]).longValue() : null;
            case PERSON -> row[0] != null ? ((Number) row[0]).longValue() : null;
            default -> null;
        };
    }

    private void calculateGewinnrate(List<ReportZeileDTO> zeilen, ReportDimension dimension,
            ReportFilterDTO filter) {
        // Check if filter excludes GEWONNEN or VERLOREN
        if (filter != null && filter.phasen() != null && !filter.phasen().isEmpty()) {
            boolean hasGewonnen = filter.phasen().contains(ChancePhase.GEWONNEN);
            boolean hasVerloren = filter.phasen().contains(ChancePhase.VERLOREN);
            if (!hasGewonnen || !hasVerloren) {
                // Cannot calculate Gewinnrate without both phases
                for (ReportZeileDTO zeile : zeilen) {
                    zeile.werte().put(ReportMetrik.GEWINNRATE.name(), null);
                }
                return;
            }
        }

        // For PHASE dimension, calculate inline
        if (dimension == ReportDimension.PHASE) {
            for (ReportZeileDTO zeile : zeilen) {
                if ("GEWONNEN".equals(zeile.label()) || "VERLOREN".equals(zeile.label())) {
                    // Will be calculated after iterating
                }
                zeile.werte().put(ReportMetrik.GEWINNRATE.name(), null);
            }

            // Find Gewonnen and Verloren counts
            long gewonnen = 0;
            long verloren = 0;
            for (ReportZeileDTO zeile : zeilen) {
                Number anzahl = zeile.werte().get(ReportMetrik.ANZAHL.name());
                if (anzahl == null) {
                    // Need a separate count query
                    break;
                }
                if ("GEWONNEN".equals(zeile.label())) {
                    gewonnen = anzahl.longValue();
                } else if ("VERLOREN".equals(zeile.label())) {
                    verloren = anzahl.longValue();
                }
            }

            BigDecimal rate = (gewonnen + verloren) > 0
                    ? BigDecimal.valueOf((double) gewonnen / (gewonnen + verloren) * 100.0)
                    : null;

            // Set Gewinnrate for all phase rows (same global rate)
            for (ReportZeileDTO zeile : zeilen) {
                zeile.werte().put(ReportMetrik.GEWINNRATE.name(), rate);
            }
            return;
        }

        // For other dimensions: run a separate query per group
        String gewinnrateJpql = buildGewinnrateQuery(dimension, filter);
        Query query = entityManager.createQuery(gewinnrateJpql);
        setParameters(query, filter);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        // Build a lookup: label -> gewinnrate
        Map<String, BigDecimal> rateByLabel = new LinkedHashMap<>();
        for (Object[] row : results) {
            String label = buildLabel(row, dimension);
            int offset = dimensionColumnCount(dimension);
            long gewonnen = ((Number) row[offset]).longValue();
            long verloren = ((Number) row[offset + 1]).longValue();
            BigDecimal rate = (gewonnen + verloren) > 0
                    ? BigDecimal.valueOf((double) gewonnen / (gewonnen + verloren) * 100.0)
                    : null;
            rateByLabel.put(label, rate);
        }

        for (ReportZeileDTO zeile : zeilen) {
            zeile.werte().put(ReportMetrik.GEWINNRATE.name(), rateByLabel.get(zeile.label()));
        }
    }

    private String buildGewinnrateQuery(ReportDimension dimension, ReportFilterDTO filter) {
        StringBuilder sb = new StringBuilder("SELECT ");
        sb.append(dimensionSelect(dimension));
        sb.append(", SUM(CASE WHEN c.phase = com.crm.entity.enums.ChancePhase.GEWONNEN THEN 1 ELSE 0 END)");
        sb.append(", SUM(CASE WHEN c.phase = com.crm.entity.enums.ChancePhase.VERLOREN THEN 1 ELSE 0 END)");
        sb.append(" FROM Chance c");
        sb.append(" LEFT JOIN c.firma f");
        sb.append(" LEFT JOIN c.kontaktPerson p");

        List<String> conditions = new ArrayList<>();
        conditions.add("(c.phase = com.crm.entity.enums.ChancePhase.GEWONNEN OR c.phase = com.crm.entity.enums.ChancePhase.VERLOREN)");
        if (dimension == ReportDimension.PERSON) {
            conditions.add("c.kontaktPerson IS NOT NULL");
        } else if (dimension == ReportDimension.MONAT || dimension == ReportDimension.QUARTAL
                || dimension == ReportDimension.JAHR) {
            conditions.add("c.erwartetesDatum IS NOT NULL");
        }
        if (filter != null) {
            if (filter.datumVon() != null) {
                conditions.add("c.erwartetesDatum >= :datumVon");
            }
            if (filter.datumBis() != null) {
                conditions.add("c.erwartetesDatum <= :datumBis");
            }
        }

        sb.append(" WHERE ").append(String.join(" AND ", conditions));
        sb.append(" GROUP BY ").append(dimensionGroupBy(dimension));
        sb.append(" ORDER BY ").append(dimensionOrderBy(dimension));

        return sb.toString();
    }
}
