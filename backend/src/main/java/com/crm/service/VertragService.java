package com.crm.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.VertragCreateDTO;
import com.crm.dto.VertragDTO;
import com.crm.entity.Firma;
import com.crm.entity.Person;
import com.crm.entity.Vertrag;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.VertragMapper;
import com.crm.repository.FirmaRepository;
import com.crm.repository.PersonRepository;
import com.crm.repository.VertragRepository;

@Service
@Transactional
public class VertragService {

    private final VertragRepository vertragRepository;
    private final FirmaRepository firmaRepository;
    private final PersonRepository personRepository;

    public VertragService(VertragRepository vertragRepository,
                          FirmaRepository firmaRepository,
                          PersonRepository personRepository) {
        this.vertragRepository = vertragRepository;
        this.firmaRepository = firmaRepository;
        this.personRepository = personRepository;
    }

    @Transactional(readOnly = true)
    public Page<VertragDTO> findAll(Pageable pageable) {
        return vertragRepository.findAll(pageable).map(VertragMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public VertragDTO findById(Long id) {
        Vertrag vertrag = vertragRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vertrag", id));
        return VertragMapper.toDTO(vertrag);
    }

    @Transactional(readOnly = true)
    public Page<VertragDTO> findByFirmaId(Long firmaId, Pageable pageable) {
        return vertragRepository.findByFirmaId(firmaId, pageable).map(VertragMapper::toDTO);
    }

    public VertragDTO create(VertragCreateDTO dto) {
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Person kontaktPerson = dto.kontaktPersonId() != null
                ? personRepository.findById(dto.kontaktPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.kontaktPersonId()))
                : null;
        Vertrag vertrag = VertragMapper.toEntity(dto, firma, kontaktPerson);
        vertrag = vertragRepository.save(vertrag);
        return VertragMapper.toDTO(vertrag);
    }

    public VertragDTO update(Long id, VertragCreateDTO dto) {
        Vertrag vertrag = vertragRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vertrag", id));
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Person kontaktPerson = dto.kontaktPersonId() != null
                ? personRepository.findById(dto.kontaktPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.kontaktPersonId()))
                : null;
        VertragMapper.applyToEntity(dto, vertrag);
        vertrag.setFirma(firma);
        vertrag.setKontaktPerson(kontaktPerson);
        vertrag = vertragRepository.save(vertrag);
        return VertragMapper.toDTO(vertrag);
    }

    public void delete(Long id) {
        Vertrag vertrag = vertragRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vertrag", id));
        vertragRepository.delete(vertrag);
    }
}
