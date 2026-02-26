package com.crm.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.crm.entity.enums.ChancePhase;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "chance")
public class Chance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String titel;

    @Column(columnDefinition = "CLOB")
    private String beschreibung;

    @Column(precision = 15, scale = 2)
    private BigDecimal wert;

    @Column(length = 3)
    private String currency = "EUR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChancePhase phase;

    @Column()
    private Integer wahrscheinlichkeit;

    private LocalDate erwartetesDatum;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "firma_id", nullable = false)
    private Firma firma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kontakt_person_id")
    private Person kontaktPerson;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitel() { return titel; }
    public void setTitel(String titel) { this.titel = titel; }
    public String getBeschreibung() { return beschreibung; }
    public void setBeschreibung(String beschreibung) { this.beschreibung = beschreibung; }
    public BigDecimal getWert() { return wert; }
    public void setWert(BigDecimal wert) { this.wert = wert; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public ChancePhase getPhase() { return phase; }
    public void setPhase(ChancePhase phase) { this.phase = phase; }
    public Integer getWahrscheinlichkeit() { return wahrscheinlichkeit; }
    public void setWahrscheinlichkeit(Integer wahrscheinlichkeit) { this.wahrscheinlichkeit = wahrscheinlichkeit; }
    public LocalDate getErwartetesDatum() { return erwartetesDatum; }
    public void setErwartetesDatum(LocalDate erwartetesDatum) { this.erwartetesDatum = erwartetesDatum; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Firma getFirma() { return firma; }
    public void setFirma(Firma firma) { this.firma = firma; }
    public Person getKontaktPerson() { return kontaktPerson; }
    public void setKontaktPerson(Person kontaktPerson) { this.kontaktPerson = kontaktPerson; }
}
