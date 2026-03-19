package com.crm.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.Person;

public interface PersonRepository extends JpaRepository<Person, Long> {
    Page<Person> findByFirmaId(Long firmaId, Pageable pageable);
    Page<Person> findByAbteilungId(Long abteilungId, Pageable pageable);
    Page<Person> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName, Pageable pageable);
    long countByFirmaId(Long firmaId);

    @EntityGraph(attributePaths = {"firma"})
    Page<Person> findAllWithFirmaBy(Pageable pageable);
}
