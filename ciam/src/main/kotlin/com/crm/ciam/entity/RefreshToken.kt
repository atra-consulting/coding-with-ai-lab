package com.crm.ciam.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "refresh_token")
class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @Column(nullable = false, unique = true)
    var token: String = ""

    @ManyToOne
    @JoinColumn(name = "benutzer_id", nullable = false)
    var benutzer: Benutzer? = null

    @Column(nullable = false)
    var expiryDate: Instant? = null

    @Column(nullable = false)
    var createdAt: Instant? = null
}
