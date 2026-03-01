package com.crm.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crm.entity.DashboardConfig;

public interface DashboardConfigRepository extends JpaRepository<DashboardConfig, Long> {
    Optional<DashboardConfig> findByBenutzerId(Long benutzerId);
}
