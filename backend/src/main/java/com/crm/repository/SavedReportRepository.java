package com.crm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.SavedReport;

public interface SavedReportRepository extends JpaRepository<SavedReport, Long> {

    List<SavedReport> findByBenutzerIdOrderByUpdatedAtDesc(Long benutzerId);
}
