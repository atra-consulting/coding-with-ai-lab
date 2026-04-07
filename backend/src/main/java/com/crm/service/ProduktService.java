package com.crm.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.ProduktCreateDTO;
import com.crm.dto.ProduktDTO;
import com.crm.entity.Produkt;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.ProduktMapper;
import com.crm.repository.ProduktRepository;

@Service
@Transactional
public class ProduktService {

    private final ProduktRepository produktRepository;

    public ProduktService(ProduktRepository produktRepository) {
        this.produktRepository = produktRepository;
    }

    @Transactional(readOnly = true)
    public List<ProduktDTO> listAll() {
        return produktRepository.findAll().stream().map(ProduktMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public Page<ProduktDTO> findAll(Pageable pageable) {
        return produktRepository.findAll(pageable).map(ProduktMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public ProduktDTO findById(Long id) {
        Produkt produkt = produktRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produkt", id));
        return ProduktMapper.toDTO(produkt);
    }

    public ProduktDTO create(ProduktCreateDTO dto) {
        Produkt produkt = ProduktMapper.toEntity(dto);
        produkt = produktRepository.save(produkt);
        return ProduktMapper.toDTO(produkt);
    }

    public ProduktDTO update(Long id, ProduktCreateDTO dto) {
        Produkt produkt = produktRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produkt", id));
        ProduktMapper.applyToEntity(dto, produkt);
        produkt = produktRepository.save(produkt);
        return ProduktMapper.toDTO(produkt);
    }

    public void delete(Long id) {
        Produkt produkt = produktRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produkt", id));
        produktRepository.delete(produkt);
    }
}
