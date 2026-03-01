package com.crm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "dashboard_config")
public class DashboardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "benutzer_id", nullable = false, unique = true)
    private Benutzer benutzer;

    @Column(length = 1024)
    private String config;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Benutzer getBenutzer() { return benutzer; }
    public void setBenutzer(Benutzer benutzer) { this.benutzer = benutzer; }
    public String getConfig() { return config; }
    public void setConfig(String config) { this.config = config; }
}
