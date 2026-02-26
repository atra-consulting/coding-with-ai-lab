package com.crm.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.AbteilungCreateDTO;
import com.crm.dto.AbteilungDTO;
import com.crm.entity.Abteilung;
import com.crm.entity.Firma;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.AbteilungMapper;
import com.crm.repository.AbteilungRepository;
import com.crm.repository.FirmaRepository;

@Service
@Transactional
public class AbteilungService {

    private final AbteilungRepository abteilungRepository;
    private final FirmaRepository firmaRepository;

    public AbteilungService(AbteilungRepository abteilungRepository, FirmaRepository firmaRepository) {
        this.abteilungRepository = abteilungRepository;
        this.firmaRepository = firmaRepository;
    }

    @Transactional(readOnly = true)
    public Page<AbteilungDTO> findAll(Pageable pageable) {
        return abteilungRepository.findAll(pageable).map(AbteilungMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public AbteilungDTO findById(Long id) {
        Abteilung abteilung = abteilungRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Abteilung", id));
        return AbteilungMapper.toDTO(abteilung);
    }

    @Transactional(readOnly = true)
    public Page<AbteilungDTO> findByFirmaId(Long firmaId, Pageable pageable) {
        return abteilungRepository.findByFirmaId(firmaId, pageable).map(AbteilungMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public List<AbteilungDTO> findAllByFirmaId(Long firmaId) {
        return abteilungRepository.findAllByFirmaId(firmaId).stream()
                .map(AbteilungMapper::toDTO)
                .toList();
    }

    public AbteilungDTO create(AbteilungCreateDTO dto) {
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Abteilung abteilung = AbteilungMapper.toEntity(dto, firma);
        return AbteilungMapper.toDTO(abteilungRepository.save(abteilung));
    }

    public AbteilungDTO update(Long id, AbteilungCreateDTO dto) {
        Abteilung abteilung = abteilungRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Abteilung", id));
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        AbteilungMapper.applyToEntity(dto, abteilung);
        abteilung.setFirma(firma);
        return AbteilungMapper.toDTO(abteilungRepository.save(abteilung));
    }

    public void delete(Long id) {
        Abteilung abteilung = abteilungRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Abteilung", id));
        abteilungRepository.delete(abteilung);
    }
}
