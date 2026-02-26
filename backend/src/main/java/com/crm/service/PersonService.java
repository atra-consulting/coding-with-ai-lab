package com.crm.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.PersonCreateDTO;
import com.crm.dto.PersonDTO;
import com.crm.entity.Abteilung;
import com.crm.entity.Firma;
import com.crm.entity.Person;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.PersonMapper;
import com.crm.repository.AbteilungRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.PersonRepository;

@Service
@Transactional
public class PersonService {

    private final PersonRepository personRepository;
    private final FirmaRepository firmaRepository;
    private final AbteilungRepository abteilungRepository;

    public PersonService(PersonRepository personRepository, FirmaRepository firmaRepository, AbteilungRepository abteilungRepository) {
        this.personRepository = personRepository;
        this.firmaRepository = firmaRepository;
        this.abteilungRepository = abteilungRepository;
    }

    @Transactional(readOnly = true)
    public Page<PersonDTO> findAll(String search, Pageable pageable) {
        Page<Person> page;
        if (search == null || search.isBlank()) {
            page = personRepository.findAll(pageable);
        } else {
            page = personRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(search, search, pageable);
        }
        return page.map(PersonMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public PersonDTO findById(Long id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Person", id));
        return PersonMapper.toDTO(person);
    }

    @Transactional(readOnly = true)
    public Page<PersonDTO> findByFirmaId(Long firmaId, Pageable pageable) {
        return personRepository.findByFirmaId(firmaId, pageable).map(PersonMapper::toDTO);
    }

    public PersonDTO create(PersonCreateDTO dto) {
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Abteilung abteilung = dto.abteilungId() != null
                ? abteilungRepository.findById(dto.abteilungId())
                    .orElseThrow(() -> new ResourceNotFoundException("Abteilung", dto.abteilungId()))
                : null;
        Person person = PersonMapper.toEntity(dto, firma, abteilung);
        return PersonMapper.toDTO(personRepository.save(person));
    }

    public PersonDTO update(Long id, PersonCreateDTO dto) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Person", id));
        Firma firma = firmaRepository.findById(dto.firmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()));
        Abteilung abteilung = dto.abteilungId() != null
                ? abteilungRepository.findById(dto.abteilungId())
                    .orElseThrow(() -> new ResourceNotFoundException("Abteilung", dto.abteilungId()))
                : null;
        PersonMapper.applyToEntity(dto, person);
        person.setFirma(firma);
        person.setAbteilung(abteilung);
        return PersonMapper.toDTO(personRepository.save(person));
    }

    public void delete(Long id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Person", id));
        personRepository.delete(person);
    }
}
