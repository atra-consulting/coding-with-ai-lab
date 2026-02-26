package com.crm.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "firma")
public class Firma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 255)
    private String industry;

    @Column(length = 255)
    private String website;

    @Column(length = 50)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(columnDefinition = "CLOB")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "firma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Person> personen = new ArrayList<>();

    @OneToMany(mappedBy = "firma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Abteilung> abteilungen = new ArrayList<>();

    @OneToMany(mappedBy = "firma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Adresse> adressen = new ArrayList<>();

    @OneToMany(mappedBy = "firma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Aktivitaet> aktivitaeten = new ArrayList<>();

    @OneToMany(mappedBy = "firma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vertrag> vertraege = new ArrayList<>();

    @OneToMany(mappedBy = "firma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Chance> chancen = new ArrayList<>();

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
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<Person> getPersonen() { return personen; }
    public void setPersonen(List<Person> personen) { this.personen = personen; }
    public List<Abteilung> getAbteilungen() { return abteilungen; }
    public void setAbteilungen(List<Abteilung> abteilungen) { this.abteilungen = abteilungen; }
    public List<Adresse> getAdressen() { return adressen; }
    public void setAdressen(List<Adresse> adressen) { this.adressen = adressen; }
    public List<Aktivitaet> getAktivitaeten() { return aktivitaeten; }
    public void setAktivitaeten(List<Aktivitaet> aktivitaeten) { this.aktivitaeten = aktivitaeten; }
    public List<Vertrag> getVertraege() { return vertraege; }
    public void setVertraege(List<Vertrag> vertraege) { this.vertraege = vertraege; }
    public List<Chance> getChancen() { return chancen; }
    public void setChancen(List<Chance> chancen) { this.chancen = chancen; }
}
