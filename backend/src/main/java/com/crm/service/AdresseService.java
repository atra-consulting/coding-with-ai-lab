package com.crm.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.dto.AdresseCreateDTO;
import com.crm.dto.AdresseDTO;
import com.crm.entity.Adresse;
import com.crm.entity.Firma;
import com.crm.entity.Person;
import com.crm.exception.ResourceNotFoundException;
import com.crm.mapper.AdresseMapper;
import com.crm.repository.AdresseRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.PersonRepository;

@Service
@Transactional
public class AdresseService {

    private final AdresseRepository adresseRepository;
    private final FirmaRepository firmaRepository;
    private final PersonRepository personRepository;

    public AdresseService(AdresseRepository adresseRepository, FirmaRepository firmaRepository, PersonRepository personRepository) {
        this.adresseRepository = adresseRepository;
        this.firmaRepository = firmaRepository;
        this.personRepository = personRepository;
    }

    @Transactional(readOnly = true)
    public List<AdresseDTO> listAll() {
        return adresseRepository.findAll().stream().map(AdresseMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public Page<AdresseDTO> findAll(Pageable pageable) {
        return adresseRepository.findAll(pageable).map(AdresseMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public AdresseDTO findById(Long id) {
        Adresse adresse = adresseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse", id));
        return AdresseMapper.toDTO(adresse);
    }

    @Transactional(readOnly = true)
    public Page<AdresseDTO> findByFirmaId(Long firmaId, Pageable pageable) {
        return adresseRepository.findByFirmaId(firmaId, pageable).map(AdresseMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<AdresseDTO> findByPersonId(Long personId, Pageable pageable) {
        return adresseRepository.findByPersonId(personId, pageable).map(AdresseMapper::toDTO);
    }

    public AdresseDTO create(AdresseCreateDTO dto) {
        Firma firma = dto.firmaId() != null
                ? firmaRepository.findById(dto.firmaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()))
                : null;
        Person person = dto.personId() != null
                ? personRepository.findById(dto.personId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.personId()))
                : null;
        Adresse adresse = AdresseMapper.toEntity(dto, firma, person);
        return AdresseMapper.toDTO(adresseRepository.save(adresse));
    }

    public AdresseDTO update(Long id, AdresseCreateDTO dto) {
        Adresse adresse = adresseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse", id));
        Firma firma = dto.firmaId() != null
                ? firmaRepository.findById(dto.firmaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Firma", dto.firmaId()))
                : null;
        Person person = dto.personId() != null
                ? personRepository.findById(dto.personId())
                    .orElseThrow(() -> new ResourceNotFoundException("Person", dto.personId()))
                : null;
        AdresseMapper.applyToEntity(dto, adresse);
        adresse.setFirma(firma);
        adresse.setPerson(person);
        return AdresseMapper.toDTO(adresseRepository.save(adresse));
    }

    public void delete(Long id) {
        Adresse adresse = adresseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse", id));
        adresseRepository.delete(adresse);
    }
}
