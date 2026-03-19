package com.crm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "adresse")
public class Adresse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String street;

    @Column(length = 20)
    private String houseNumber;

    @Column(nullable = false, length = 20)
    private String postalCode;

    @Column(nullable = false, length = 255)
    private String city;

    @Column(length = 255)
    private String country = "Deutschland";

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "firma_id")
    private Firma firma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getHouseNumber() { return houseNumber; }
    public void setHouseNumber(String houseNumber) { this.houseNumber = houseNumber; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Firma getFirma() { return firma; }
    public void setFirma(Firma firma) { this.firma = firma; }
    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }
}
