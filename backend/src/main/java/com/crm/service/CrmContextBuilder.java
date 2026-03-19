package com.crm.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crm.config.AssistantProperties;
import com.crm.entity.Abteilung;
import com.crm.entity.Adresse;
import com.crm.entity.Aktivitaet;
import com.crm.entity.Chance;
import com.crm.entity.Firma;
import com.crm.entity.Gehalt;
import com.crm.entity.Person;
import com.crm.entity.Vertrag;
import com.crm.repository.AbteilungRepository;
import com.crm.repository.AdresseRepository;
import com.crm.repository.AktivitaetRepository;
import com.crm.repository.ChanceRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.GehaltRepository;
import com.crm.repository.PersonRepository;
import com.crm.repository.VertragRepository;

@Service
public class CrmContextBuilder {

    private final FirmaRepository firmaRepository;
    private final PersonRepository personRepository;
    private final AbteilungRepository abteilungRepository;
    private final AdresseRepository adresseRepository;
    private final AktivitaetRepository aktivitaetRepository;
    private final VertragRepository vertragRepository;
    private final ChanceRepository chanceRepository;
    private final GehaltRepository gehaltRepository;
    private final int maxRecords;

    public CrmContextBuilder(FirmaRepository firmaRepository,
                             PersonRepository personRepository,
                             AbteilungRepository abteilungRepository,
                             AdresseRepository adresseRepository,
                             AktivitaetRepository aktivitaetRepository,
                             VertragRepository vertragRepository,
                             ChanceRepository chanceRepository,
                             GehaltRepository gehaltRepository,
                             AssistantProperties properties) {
        this.firmaRepository = firmaRepository;
        this.personRepository = personRepository;
        this.abteilungRepository = abteilungRepository;
        this.adresseRepository = adresseRepository;
        this.aktivitaetRepository = aktivitaetRepository;
        this.vertragRepository = vertragRepository;
        this.chanceRepository = chanceRepository;
        this.gehaltRepository = gehaltRepository;
        this.maxRecords = properties.context().maxRecordsPerEntity();
    }

    @Transactional(readOnly = true)
    public String buildContext(String userMessage,
                               Collection<? extends GrantedAuthority> authorities) {
        Set<String> permissions = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        var page = PageRequest.of(0, maxRecords);
        var sections = new ArrayList<String>();

        if (permissions.contains("FIRMEN")) {
            List<Firma> firmen = firmaRepository.findAll(page).getContent();
            if (!firmen.isEmpty()) {
                sections.add(formatFirmen(firmen));
            }
        }

        if (permissions.contains("PERSONEN")) {
            List<Person> personen = personRepository.findAll(page).getContent();
            if (!personen.isEmpty()) {
                sections.add(formatPersonen(personen));
            }
        }

        if (permissions.contains("ABTEILUNGEN")) {
            List<Abteilung> abteilungen = abteilungRepository.findAll(page).getContent();
            if (!abteilungen.isEmpty()) {
                sections.add(formatAbteilungen(abteilungen));
            }
        }

        if (permissions.contains("ADRESSEN")) {
            List<Adresse> adressen = adresseRepository.findAll(page).getContent();
            if (!adressen.isEmpty()) {
                sections.add(formatAdressen(adressen));
            }
        }

        if (permissions.contains("AKTIVITAETEN")) {
            List<Aktivitaet> aktivitaeten = aktivitaetRepository.findAll(page).getContent();
            if (!aktivitaeten.isEmpty()) {
                sections.add(formatAktivitaeten(aktivitaeten));
            }
        }

        if (permissions.contains("GEHAELTER")) {
            List<Gehalt> gehaelter = gehaltRepository.findAll(page).getContent();
            if (!gehaelter.isEmpty()) {
                sections.add(formatGehaelter(gehaelter));
            }
        }

        if (permissions.contains("VERTRAEGE")) {
            List<Vertrag> vertraege = vertragRepository.findAll(page).getContent();
            if (!vertraege.isEmpty()) {
                sections.add(formatVertraege(vertraege));
            }
        }

        if (permissions.contains("CHANCEN")) {
            List<Chance> chancen = chanceRepository.findAll(page).getContent();
            if (!chancen.isEmpty()) {
                sections.add(formatChancen(chancen));
            }
        }

        return String.join("\n\n", sections);
    }

    private String formatFirmen(List<Firma> firmen) {
        var sb = new StringBuilder("=== FIRMEN (" + firmen.size() + " Eintraege) ===\n");
        for (var f : firmen) {
            sb.append("- ID: ").append(f.getId())
              .append(" | Name: ").append(f.getName())
              .append(" | Branche: ").append(orEmpty(f.getIndustry()))
              .append(" | Telefon: ").append(orEmpty(f.getPhone()))
              .append(" | Email: ").append(orEmpty(f.getEmail()))
              .append("\n");
        }
        return sb.toString();
    }

    private String formatPersonen(List<Person> personen) {
        var sb = new StringBuilder("=== PERSONEN (" + personen.size() + " Eintraege) ===\n");
        for (var p : personen) {
            sb.append("- ID: ").append(p.getId())
              .append(" | Name: ").append(p.getFirstName()).append(" ").append(p.getLastName())
              .append(" | Position: ").append(orEmpty(p.getPosition()))
              .append(" | Firma: ").append(p.getFirma() != null ? p.getFirma().getName() + " (ID: " + p.getFirma().getId() + ")" : "-")
              .append(" | Email: ").append(orEmpty(p.getEmail()))
              .append("\n");
        }
        return sb.toString();
    }

    private String formatAbteilungen(List<Abteilung> abteilungen) {
        var sb = new StringBuilder("=== ABTEILUNGEN (" + abteilungen.size() + " Eintraege) ===\n");
        for (var a : abteilungen) {
            sb.append("- ID: ").append(a.getId())
              .append(" | Name: ").append(a.getName())
              .append(" | Firma: ").append(a.getFirma() != null ? a.getFirma().getName() + " (ID: " + a.getFirma().getId() + ")" : "-")
              .append("\n");
        }
        return sb.toString();
    }

    private String formatAdressen(List<Adresse> adressen) {
        var sb = new StringBuilder("=== ADRESSEN (" + adressen.size() + " Eintraege) ===\n");
        for (var a : adressen) {
            sb.append("- ID: ").append(a.getId())
              .append(" | Strasse: ").append(a.getStreet()).append(" ").append(orEmpty(a.getHouseNumber()))
              .append(" | PLZ: ").append(a.getPostalCode())
              .append(" | Stadt: ").append(a.getCity())
              .append(" | Land: ").append(orEmpty(a.getCountry()))
              .append(" | Firma: ").append(a.getFirma() != null ? a.getFirma().getName() + " (ID: " + a.getFirma().getId() + ")" : "-")
              .append(" | Person: ").append(a.getPerson() != null ? a.getPerson().getFirstName() + " " + a.getPerson().getLastName() + " (ID: " + a.getPerson().getId() + ")" : "-")
              .append("\n");
        }
        return sb.toString();
    }

    private String formatAktivitaeten(List<Aktivitaet> aktivitaeten) {
        var sb = new StringBuilder("=== AKTIVITAETEN (" + aktivitaeten.size() + " Eintraege) ===\n");
        for (var a : aktivitaeten) {
            sb.append("- ID: ").append(a.getId())
              .append(" | Typ: ").append(a.getTyp())
              .append(" | Betreff: ").append(a.getSubject())
              .append(" | Datum: ").append(a.getDatum())
              .append(" | Firma: ").append(a.getFirma() != null ? a.getFirma().getName() + " (ID: " + a.getFirma().getId() + ")" : "-")
              .append(" | Person: ").append(a.getPerson() != null ? a.getPerson().getFirstName() + " " + a.getPerson().getLastName() + " (ID: " + a.getPerson().getId() + ")" : "-")
              .append("\n");
        }
        return sb.toString();
    }

    private String formatGehaelter(List<Gehalt> gehaelter) {
        var sb = new StringBuilder("=== GEHAELTER (" + gehaelter.size() + " Eintraege) ===\n");
        for (var g : gehaelter) {
            sb.append("- ID: ").append(g.getId())
              .append(" | Betrag: ").append(g.getAmount()).append(" ").append(g.getCurrency())
              .append(" | Typ: ").append(g.getTyp())
              .append(" | Ab: ").append(g.getEffectiveDate())
              .append(" | Person: ").append(g.getPerson() != null ? g.getPerson().getFirstName() + " " + g.getPerson().getLastName() + " (ID: " + g.getPerson().getId() + ")" : "-")
              .append("\n");
        }
        return sb.toString();
    }

    private String formatVertraege(List<Vertrag> vertraege) {
        var sb = new StringBuilder("=== VERTRAEGE (" + vertraege.size() + " Eintraege) ===\n");
        for (var v : vertraege) {
            sb.append("- ID: ").append(v.getId())
              .append(" | Titel: ").append(v.getTitel())
              .append(" | Wert: ").append(v.getWert() != null ? v.getWert() + " " + v.getCurrency() : "-")
              .append(" | Status: ").append(v.getStatus())
              .append(" | Von: ").append(v.getStartDate())
              .append(" | Bis: ").append(v.getEndDate())
              .append(" | Firma: ").append(v.getFirma() != null ? v.getFirma().getName() + " (ID: " + v.getFirma().getId() + ")" : "-")
              .append("\n");
        }
        return sb.toString();
    }

    private String formatChancen(List<Chance> chancen) {
        var sb = new StringBuilder("=== CHANCEN (" + chancen.size() + " Eintraege) ===\n");
        for (var c : chancen) {
            sb.append("- ID: ").append(c.getId())
              .append(" | Titel: ").append(c.getTitel())
              .append(" | Wert: ").append(c.getWert() != null ? c.getWert() + " " + c.getCurrency() : "-")
              .append(" | Phase: ").append(c.getPhase())
              .append(" | Wahrscheinlichkeit: ").append(c.getWahrscheinlichkeit() != null ? c.getWahrscheinlichkeit() + "%" : "-")
              .append(" | Firma: ").append(c.getFirma() != null ? c.getFirma().getName() + " (ID: " + c.getFirma().getId() + ")" : "-")
              .append("\n");
        }
        return sb.toString();
    }

    private static String orEmpty(String value) {
        return value != null ? value : "-";
    }
}
