package com.crm.ciam.security

import com.crm.ciam.entity.enums.BenutzerRolle
import java.util.EnumMap
import java.util.EnumSet

object RolePermissionMapping {

    private val MAPPING: EnumMap<BenutzerRolle, Set<Permission>> = EnumMap<BenutzerRolle, Set<Permission>>(BenutzerRolle::class.java).apply {
        put(BenutzerRolle.ADMIN, EnumSet.allOf(Permission::class.java))

        put(BenutzerRolle.VERTRIEB, EnumSet.of(
            Permission.DASHBOARD,
            Permission.FIRMEN,
            Permission.PERSONEN,
            Permission.ABTEILUNGEN,
            Permission.ADRESSEN,
            Permission.AKTIVITAETEN,
            Permission.VERTRAEGE,
            Permission.CHANCEN,
            Permission.AUSWERTUNGEN
        ))

        put(BenutzerRolle.PERSONAL, EnumSet.of(
            Permission.DASHBOARD,
            Permission.FIRMEN,
            Permission.PERSONEN,
            Permission.ABTEILUNGEN,
            Permission.ADRESSEN,
            Permission.AKTIVITAETEN,
            Permission.GEHAELTER,
            Permission.AUSWERTUNGEN
        ))
    }

    fun getPermissions(rollen: Set<BenutzerRolle>): Set<Permission> =
        rollen.flatMap { rolle ->
            MAPPING.getOrDefault(rolle, EnumSet.noneOf(Permission::class.java))
        }.toSet()

    fun hasPermission(rollen: Set<BenutzerRolle>, permission: Permission): Boolean =
        getPermissions(rollen).contains(permission)
}
