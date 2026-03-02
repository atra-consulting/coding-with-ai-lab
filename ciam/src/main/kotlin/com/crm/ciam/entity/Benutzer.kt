package com.crm.ciam.entity

import com.crm.ciam.entity.enums.BenutzerRolle
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "benutzer")
class Benutzer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @Column(nullable = false, unique = true, length = 50)
    var benutzername: String = ""

    @Column(nullable = false)
    var passwort: String = ""

    @Column(nullable = false, length = 100)
    var vorname: String = ""

    @Column(nullable = false, length = 100)
    var nachname: String = ""

    @Column(nullable = false, unique = true, length = 255)
    var email: String = ""

    @Column(nullable = false)
    var aktiv: Boolean = true

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "benutzer_rollen", joinColumns = [JoinColumn(name = "benutzer_id")])
    @Enumerated(EnumType.STRING)
    @Column(name = "rolle")
    var rollen: MutableSet<BenutzerRolle> = mutableSetOf()

    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime? = null

    @Column(nullable = false)
    var updatedAt: LocalDateTime? = null

    @PrePersist
    protected fun onCreate() {
        createdAt = LocalDateTime.now()
        updatedAt = LocalDateTime.now()
    }

    @PreUpdate
    protected fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
