package com.crm.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.AktivitaetCreateDTO;
import com.crm.dto.AktivitaetDTO;
import com.crm.entity.Aktivitaet;
import com.crm.entity.Firma;
import com.crm.entity.Person;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.AktivitaetMapper;
import com.crm.repository.AktivitaetRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.PersonRepository;

@Service
@Transactional
public class AktivitaetService {

    private final AktivitaetRepository aktivitaetRepository;
    private final FirmaRepository firmaRepository;
    private final PersonRepository personRepository;

    public AktivitaetService(AktivitaetRepository aktivitaetRepository,
                             FirmaRepository firmaRepository,
                             PersonRepository personRepository) {
        this.aktivitaetRepository = aktivitaetRepository;
        this.firmaRepository = firmaRepository;
        this.personRepository = personRepository;
    }

    @Transactional(readOnly = true)
    public Page<AktivitaetDTO> findAll(Pageable pageable) {
        return aktivitaetRepository.findAll(pageable).map(AktivitaetMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public AktivitaetDTO findById(Long id) {
        Aktivitaet aktivitaet = aktivitaetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aktivitaet", id));
        return AktivitaetMapper.toDTO(aktivitaet);
    }

    public AktivitaetDTO create(AktivitaetCreateDTO dto) {
        Firma firma = dto.firmaId() != null
                ? firmaRepository.findById(dto.firmaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()))
                : null;
        Person person = dto.personId() != null
                ? personRepository.findById(dto.personId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.personId()))
                : null;
        Aktivitaet aktivitaet = AktivitaetMapper.toEntity(dto, firma, person);
        aktivitaet = aktivitaetRepository.save(aktivitaet);
        return AktivitaetMapper.toDTO(aktivitaet);
    }

    public AktivitaetDTO update(Long id, AktivitaetCreateDTO dto) {
        Aktivitaet aktivitaet = aktivitaetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aktivitaet", id));
        Firma firma = dto.firmaId() != null
                ? firmaRepository.findById(dto.firmaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()))
                : null;
        Person person = dto.personId() != null
                ? personRepository.findById(dto.personId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.personId()))
                : null;
        AktivitaetMapper.applyToEntity(dto, aktivitaet);
        aktivitaet.setFirma(firma);
        aktivitaet.setPerson(person);
        aktivitaet = aktivitaetRepository.save(aktivitaet);
        return AktivitaetMapper.toDTO(aktivitaet);
    }

    public void delete(Long id) {
        Aktivitaet aktivitaet = aktivitaetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aktivitaet", id));
        aktivitaetRepository.delete(aktivitaet);
    }
}
