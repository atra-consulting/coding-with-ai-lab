package com.crm.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.DashboardConfigDTO;
import com.crm.entity.Benutzer;
import com.crm.entity.DashboardConfig;
import com.crm.repository.DashboardConfigRepository;

@Service
@Transactional
public class DashboardConfigService {

    private final DashboardConfigRepository repository;

    public DashboardConfigService(DashboardConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<DashboardConfigDTO> getConfig(Long benutzerId) {
        return repository.findByBenutzerId(benutzerId)
                .map(dc -> {
                    String json = dc.getConfig();
                    if (json == null || json.isBlank()) {
                        return null;
                    }
                    return parseConfig(json);
                });
    }

    public DashboardConfigDTO saveConfig(Benutzer benutzer, DashboardConfigDTO dto) {
        DashboardConfig config = repository.findByBenutzerId(benutzer.getId())
                .orElseGet(() -> {
                    DashboardConfig dc = new DashboardConfig();
                    dc.setBenutzer(benutzer);
                    return dc;
                });
        config.setConfig(toJson(dto));
        repository.save(config);
        return dto;
    }

    private DashboardConfigDTO parseConfig(String json) {
        // Simple JSON parsing for ["widget1","widget2"] format
        String trimmed = json.trim();
        if (!trimmed.startsWith("[")) {
            return null;
        }
        java.util.List<String> widgets = new java.util.ArrayList<>();
        String inner = trimmed.substring(1, trimmed.length() - 1);
        if (!inner.isBlank()) {
            for (String part : inner.split(",")) {
                String cleaned = part.trim().replace("\"", "");
                if (!cleaned.isEmpty()) {
                    widgets.add(cleaned);
                }
            }
        }
        return new DashboardConfigDTO(widgets);
    }

    private String toJson(DashboardConfigDTO dto) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < dto.visibleWidgets().size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(dto.visibleWidgets().get(i)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}
