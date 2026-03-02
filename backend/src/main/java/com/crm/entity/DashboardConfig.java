package com.crm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "dashboard_config")
public class DashboardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "benutzer_id", nullable = false, unique = true)
    private Long benutzerId;

    @Column(length = 1024)
    private String config;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBenutzerId() { return benutzerId; }
    public void setBenutzerId(Long benutzerId) { this.benutzerId = benutzerId; }
    public String getConfig() { return config; }
    public void setConfig(String config) { this.config = config; }
}
