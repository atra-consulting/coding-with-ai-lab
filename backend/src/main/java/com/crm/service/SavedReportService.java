package com.crm.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.SavedReportCreateDTO;
import com.crm.dto.SavedReportDTO;
import com.crm.entity.Benutzer;
import com.crm.entity.SavedReport;
import com.crm.exception.ResourceNotFoundException;
import com.crm.repository.SavedReportRepository;

@Service
@Transactional(readOnly = true)
public class SavedReportService {

    private final SavedReportRepository savedReportRepository;

    public SavedReportService(SavedReportRepository savedReportRepository) {
        this.savedReportRepository = savedReportRepository;
    }

    public List<SavedReportDTO> getByBenutzer(Long benutzerId) {
        return savedReportRepository.findByBenutzerIdOrderByUpdatedAtDesc(benutzerId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public SavedReportDTO create(Benutzer benutzer, SavedReportCreateDTO dto) {
        SavedReport report = new SavedReport();
        report.setBenutzer(benutzer);
        report.setName(dto.name());
        report.setConfig(dto.config());
        return toDTO(savedReportRepository.save(report));
    }

    @Transactional
    public SavedReportDTO update(Long id, Long benutzerId, SavedReportCreateDTO dto) {
        SavedReport report = savedReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SavedReport", id));

        if (!report.getBenutzer().getId().equals(benutzerId)) {
            throw new ResourceNotFoundException("SavedReport", id);
        }

        report.setName(dto.name());
        report.setConfig(dto.config());
        return toDTO(savedReportRepository.save(report));
    }

    @Transactional
    public void delete(Long id, Long benutzerId) {
        SavedReport report = savedReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SavedReport", id));

        if (!report.getBenutzer().getId().equals(benutzerId)) {
            throw new ResourceNotFoundException("SavedReport", id);
        }

        savedReportRepository.delete(report);
    }

    private SavedReportDTO toDTO(SavedReport report) {
        return new SavedReportDTO(
                report.getId(),
                report.getName(),
                report.getConfig(),
                report.getCreatedAt(),
                report.getUpdatedAt());
    }
}
