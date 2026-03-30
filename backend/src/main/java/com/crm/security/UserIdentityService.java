package com.crm.security;

import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class UserIdentityService {

    private static final Map<String, Long> USER_IDS = Map.of(
            "admin", 1L,
            "vertrieb", 2L,
            "personal", 3L,
            "allrounder", 4L,
            "demo", 5L
    );

    private static final Map<String, String> VORNAME = Map.of(
            "admin", "Admin",
            "vertrieb", "Vera",
            "personal", "Paul",
            "allrounder", "Alex",
            "demo", "David"
    );

    private static final Map<String, String> NACHNAME = Map.of(
            "admin", "System",
            "vertrieb", "Vertrieb",
            "personal", "Personal",
            "allrounder", "Allrounder",
            "demo", "Demo"
    );

    public Long getIdForUser(String benutzername) {
        Long id = USER_IDS.get(benutzername);
        if (id == null) {
            throw new IllegalArgumentException("Unbekannter Benutzer: " + benutzername);
        }
        return id;
    }

    public String getVornameForUser(String benutzername) {
        return VORNAME.getOrDefault(benutzername, benutzername);
    }

    public String getNachnameForUser(String benutzername) {
        return NACHNAME.getOrDefault(benutzername, "");
    }

    public CrmPrincipal buildPrincipal(String benutzername) {
        return new CrmPrincipal(
                getIdForUser(benutzername),
                benutzername,
                getVornameForUser(benutzername),
                getNachnameForUser(benutzername)
        );
    }
}
