package com.crm.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.ChanceCreateDTO;
import com.crm.dto.ChanceDTO;
import com.crm.entity.Chance;
import com.crm.entity.Firma;
import com.crm.entity.Person;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.ChanceMapper;
import com.crm.repository.ChanceRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.PersonRepository;

@Service
@Transactional
public class ChanceService {

    private final ChanceRepository chanceRepository;
    private final FirmaRepository firmaRepository;
    private final PersonRepository personRepository;

    public ChanceService(ChanceRepository chanceRepository,
                         FirmaRepository firmaRepository,
                         PersonRepository personRepository) {
        this.chanceRepository = chanceRepository;
        this.firmaRepository = firmaRepository;
        this.personRepository = personRepository;
    }

    @Transactional(readOnly = true)
    public Page<ChanceDTO> findAll(Pageable pageable) {
        return chanceRepository.findAll(pageable).map(ChanceMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public ChanceDTO findById(Long id) {
        Chance chance = chanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chance", id));
        return ChanceMapper.toDTO(chance);
    }

    @Transactional(readOnly = true)
    public Page<ChanceDTO> findByFirmaId(Long firmaId, Pageable pageable) {
        return chanceRepository.findByFirmaId(firmaId, pageable).map(ChanceMapper::toDTO);
    }

    public ChanceDTO create(ChanceCreateDTO dto) {
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Person kontaktPerson = dto.kontaktPersonId() != null
                ? personRepository.findById(dto.kontaktPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.kontaktPersonId()))
                : null;
        Chance chance = ChanceMapper.toEntity(dto, firma, kontaktPerson);
        chance = chanceRepository.save(chance);
        return ChanceMapper.toDTO(chance);
    }

    public ChanceDTO update(Long id, ChanceCreateDTO dto) {
        Chance chance = chanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chance", id));
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Person kontaktPerson = dto.kontaktPersonId() != null
                ? personRepository.findById(dto.kontaktPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.kontaktPersonId()))
                : null;
        ChanceMapper.applyToEntity(dto, chance);
        chance.setFirma(firma);
        chance.setKontaktPerson(kontaktPerson);
        chance = chanceRepository.save(chance);
        return ChanceMapper.toDTO(chance);
    }

    public void delete(Long id) {
        Chance chance = chanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chance", id));
        chanceRepository.delete(chance);
    }
}
