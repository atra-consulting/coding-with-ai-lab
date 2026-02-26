package com.crm.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.FirmaCreateDTO;
import com.crm.dto.FirmaDTO;
import com.crm.entity.Firma;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.FirmaMapper;
import com.crm.repository.FirmaRepository;

@Service
@Transactional
public class FirmaService {

    private final FirmaRepository firmaRepository;

    public FirmaService(FirmaRepository firmaRepository) {
        this.firmaRepository = firmaRepository;
    }

    @Transactional(readOnly = true)
    public Page<FirmaDTO> findAll(String search, Pageable pageable) {
        Page<Firma> page;
        if (search == null || search.isBlank()) {
            page = firmaRepository.findAll(pageable);
        } else {
            page = firmaRepository.findByNameContainingIgnoreCase(search, pageable);
        }
        return page.map(FirmaMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public FirmaDTO findById(Long id) {
        Firma firma = firmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Firma", id));
        return FirmaMapper.toDTO(firma);
    }

    public FirmaDTO create(FirmaCreateDTO dto) {
        Firma firma = FirmaMapper.toEntity(dto);
        return FirmaMapper.toDTO(firmaRepository.save(firma));
    }

    public FirmaDTO update(Long id, FirmaCreateDTO dto) {
        Firma firma = firmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Firma", id));
        FirmaMapper.applyToEntity(dto, firma);
        return FirmaMapper.toDTO(firmaRepository.save(firma));
    }

    public void delete(Long id) {
        Firma firma = firmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Firma", id));
        firmaRepository.delete(firma);
    }
}
