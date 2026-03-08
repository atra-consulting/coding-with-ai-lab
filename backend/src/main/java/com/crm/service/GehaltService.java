package com.crm.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.GehaltCreateDTO;
import com.crm.dto.GehaltDTO;
import com.crm.entity.Gehalt;
import com.crm.entity.Person;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.GehaltMapper;
import com.crm.repository.GehaltRepository;
import com.crm.repository.PersonRepository;

@Service
@Transactional
public class GehaltService {

    private final GehaltRepository gehaltRepository;
    private final PersonRepository personRepository;

    public GehaltService(GehaltRepository gehaltRepository, PersonRepository personRepository) {
        this.gehaltRepository = gehaltRepository;
        this.personRepository = personRepository;
    }

    @Transactional(readOnly = true)
    public List<GehaltDTO> listAll() {
        return gehaltRepository.findAll().stream().map(GehaltMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public Page<GehaltDTO> findAll(Pageable pageable) {
        return gehaltRepository.findAll(pageable).map(GehaltMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public GehaltDTO findById(Long id) {
        Gehalt gehalt = gehaltRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gehalt", id));
        return GehaltMapper.toDTO(gehalt);
    }

    @Transactional(readOnly = true)
    public Page<GehaltDTO> findByPersonId(Long personId, Pageable pageable) {
        return gehaltRepository.findByPersonId(personId, pageable).map(GehaltMapper::toDTO);
    }

    public GehaltDTO create(GehaltCreateDTO dto) {
        Person person = personRepository.findById(dto.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Person", dto.personId()));
        Gehalt gehalt = GehaltMapper.toEntity(dto, person);
        gehalt = gehaltRepository.save(gehalt);
        return GehaltMapper.toDTO(gehalt);
    }

    public GehaltDTO update(Long id, GehaltCreateDTO dto) {
        Gehalt gehalt = gehaltRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gehalt", id));
        Person person = personRepository.findById(dto.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Person", dto.personId()));
        GehaltMapper.applyToEntity(dto, gehalt);
        gehalt.setPerson(person);
        gehalt = gehaltRepository.save(gehalt);
        return GehaltMapper.toDTO(gehalt);
    }

    public void delete(Long id) {
        Gehalt gehalt = gehaltRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gehalt", id));
        gehaltRepository.delete(gehalt);
    }
}
