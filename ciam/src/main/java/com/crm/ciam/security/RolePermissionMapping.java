package com.crm.ciam.security;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import com.crm.ciam.entity.enums.BenutzerRolle;

public final class RolePermissionMapping {

    private static final EnumMap<BenutzerRolle, Set<Permission>> MAPPING = new EnumMap<>(BenutzerRolle.class);

    static {
        MAPPING.put(BenutzerRolle.ADMIN, EnumSet.allOf(Permission.class));

        MAPPING.put(BenutzerRolle.VERTRIEB, EnumSet.of(
                Permission.DASHBOARD,
                Permission.FIRMEN,
                Permission.PERSONEN,
                Permission.ABTEILUNGEN,
                Permission.ADRESSEN,
                Permission.AKTIVITAETEN,
                Permission.VERTRAEGE,
                Permission.CHANCEN
        ));

        MAPPING.put(BenutzerRolle.PERSONAL, EnumSet.of(
                Permission.DASHBOARD,
                Permission.FIRMEN,
                Permission.PERSONEN,
                Permission.ABTEILUNGEN,
                Permission.ADRESSEN,
                Permission.AKTIVITAETEN,
                Permission.GEHAELTER
        ));
    }

    private RolePermissionMapping() {}

    public static Set<Permission> getPermissions(Set<BenutzerRolle> rollen) {
        return rollen.stream()
                .flatMap(rolle -> MAPPING.getOrDefault(rolle, EnumSet.noneOf(Permission.class)).stream())
                .collect(Collectors.toSet());
    }

    public static boolean hasPermission(Set<BenutzerRolle> rollen, Permission permission) {
        return getPermissions(rollen).contains(permission);
    }
}
