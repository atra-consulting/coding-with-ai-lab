package com.crm.seed;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.crm.entity.Abteilung;
import com.crm.entity.Adresse;
import com.crm.entity.Aktivitaet;
import com.crm.entity.Chance;
import com.crm.entity.Firma;
import com.crm.entity.Gehalt;
import com.crm.entity.Person;
import com.crm.entity.Produkt;
import com.crm.entity.Vertrag;
import com.crm.entity.enums.AktivitaetTyp;
import com.crm.entity.enums.ChancePhase;
import com.crm.entity.enums.GehaltTyp;
import com.crm.entity.enums.ProduktKategorie;
import com.crm.entity.enums.VertragStatus;
import com.crm.repository.AbteilungRepository;
import com.crm.repository.AdresseRepository;
import com.crm.repository.AktivitaetRepository;
import com.crm.repository.ChanceRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.GehaltRepository;
import com.crm.repository.PersonRepository;
import com.crm.repository.ProduktRepository;
import com.crm.repository.VertragRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final FirmaRepository firmaRepository;
    private final AbteilungRepository abteilungRepository;
    private final PersonRepository personRepository;
    private final AdresseRepository adresseRepository;
    private final GehaltRepository gehaltRepository;
    private final AktivitaetRepository aktivitaetRepository;
    private final VertragRepository vertragRepository;
    private final ChanceRepository chanceRepository;
    private final ProduktRepository produktRepository;

    public DataSeeder(FirmaRepository firmaRepository, AbteilungRepository abteilungRepository,
                      PersonRepository personRepository, AdresseRepository adresseRepository,
                      GehaltRepository gehaltRepository, AktivitaetRepository aktivitaetRepository,
                      VertragRepository vertragRepository, ChanceRepository chanceRepository,
                      ProduktRepository produktRepository) {
        this.firmaRepository = firmaRepository;
        this.abteilungRepository = abteilungRepository;
        this.personRepository = personRepository;
        this.adresseRepository = adresseRepository;
        this.gehaltRepository = gehaltRepository;
        this.aktivitaetRepository = aktivitaetRepository;
        this.vertragRepository = vertragRepository;
        this.chanceRepository = chanceRepository;
        this.produktRepository = produktRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (firmaRepository.count() > 0) return;

        Random random = new Random(42);
        LocalDate today = LocalDate.now();

        String[] firmaNames = {"Schmidt GmbH", "Mueller & Partner AG", "Weber IT Solutions", "Fischer Consulting", "Schneider Maschinenbau", "Hoffmann Logistik", "Koch Immobilien", "Bauer Finanzberatung", "Richter Medizintechnik", "Klein Software AG", "Wolf Automotive", "Schroeder Handels GmbH", "Neumann Energie", "Schwarz Bauunternehmen", "Zimmermann Versicherungen", "Braun Pharma GmbH", "Krueger Elektronik", "Hartmann Lebensmittel", "Werner Textilien", "Schmitt Stahlbau", "Meier Transport", "Lehmann Chemie AG", "Schmitz Sicherheitstechnik", "Lange Umwelttechnik", "Krause Werbung", "Maier Gastronomie", "Huber Telekommunikation", "Kaiser Architekten", "Fuchs Verlag", "Peters Metallbau", "Lang Optik", "Jung Reinigungstechnik", "Hahn Personalberatung", "Keller Holzbau", "Vogt Gartenbau", "Sauer Drucktechnik", "Arnold Cloud Services", "Ludwig Fahrzeugtechnik", "Friedrich Rechtsanwaelte", "Scholz Industriebedarf", "Moeller Eventmanagement", "Winkler Heizungstechnik", "Gross Design Studio", "Albrecht Recycling", "Schubert Feinmechanik", "Jansen Biotech", "Berger Windkraft", "Simon Datenschutz", "Frank Robotik", "Roth Solartechnik", "Baumann Mediengruppe", "Stein Aerospace", "Horn Gebaeudetechnik", "Lorenz Messebau", "Schuster Werkzeugbau", "Seidel Kreativagentur", "Brandt Schifffahrt", "Haas Laborgeraete", "Pfeiffer Agrar", "Koenig Spielwaren", "Beck Moebelbau", "Dietrich Kaelteanlagen", "Kunz Vermessungstechnik", "Frey Augenoptik", "Engel Hotelmanagement", "Herrmann Fassadenbau", "Bock Verkehrstechnik", "Pohl Ladenbau", "Busch Getraenke", "Voigt Sanitaertechnik", "Graf Steuerberatung", "Otto Sportartikel", "Beyer Tontechnik", "Marx Spedition", "Winter Zahnmedizin", "Ebert Drohnentechnik", "Wenzel Papierverarbeitung", "Kraft Tiefbau", "Lindner Baekereimaschinen", "Schreiber Veranstaltungstechnik", "Sommer Kuechenstudio", "Ziegler Aufzugbau", "Walter Autozubehoer", "Nolte Brandschutz", "Bergmann Giessereitechnik", "Wolff Juweliere", "Auer Milchtechnik", "Unger IT-Sicherheit", "Paul Gartenarchitektur", "Seifert Lederwarenmanufaktur", "Walther Bootsbau", "Kirsch Druckluft", "Geiger Naturkosmetik", "Hanke Stahlhandel", "Ullrich Hoergeraete", "Steiner Klimaanlagen", "Thiel Lasertechnik", "Noack Reinraumtechnik", "Kiefer Brauerei", "Dorn Verpackungstechnik"};
        String[] industries = {"IT & Software", "Finanzwesen", "Gesundheitswesen", "Maschinenbau", "Beratung", "Logistik", "Immobilien", "Energie", "Bauwesen", "Pharma", "Elektronik", "Automotive", "Handel", "Versicherungen", "Telekommunikation", "Medien", "Lebensmittel", "Chemie", "Umwelttechnik", "Sicherheitstechnik"};
        String[] abteilungNames = {"Vertrieb", "Marketing", "Entwicklung", "Personal", "Finanzen", "IT", "Produktion", "Qualitaetsmanagement", "Einkauf", "Kundenservice", "Logistik", "Forschung", "Recht", "Geschaeftsfuehrung"};
        String[] firstNames = {"Hans", "Anna", "Peter", "Maria", "Thomas", "Sabine", "Michael", "Claudia", "Stefan", "Monika", "Andreas", "Petra", "Markus", "Susanne", "Christian", "Karin", "Daniel", "Nicole", "Martin", "Birgit", "Frank", "Andrea", "Joerg", "Martina", "Bernd", "Gabriele", "Ralf", "Heike", "Juergen", "Silke"};
        String[] lastNames = {"Mueller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schaefer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schroeder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krueger", "Hartmann", "Lange", "Werner"};
        String[] positions = {"Geschaeftsfuehrer", "Projektleiter", "Entwickler", "Berater", "Vertriebsleiter", "Marketing Manager", "Controller", "Sachbearbeiter", "Teamleiter", "Analyst", "Designer", "Ingenieur", "Buchhalter", "Assistent"};
        String[] streets = {"Hauptstrasse", "Bahnhofstrasse", "Gartenweg", "Industriestrasse", "Marktplatz", "Schulstrasse", "Parkweg", "Rosenstrasse", "Bergstrasse", "Lindenallee", "Kirchgasse", "Waldweg", "Am Rathaus", "Muehlenweg", "Dorfstrasse"};
        String[] cities = {"Berlin", "Muenchen", "Hamburg", "Koeln", "Frankfurt am Main", "Stuttgart", "Duesseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hannover", "Nuernberg", "Duisburg"};
        String[] postalCodes = {"10115", "80331", "20095", "50667", "60311", "70173", "40213", "04109", "44135", "45127", "28195", "01067", "30159", "90402", "47051"};
        String[] aktivitaetSubjects = {"Erstgespraech", "Follow-up", "Projektbesprechung", "Angebotserstellung", "Status-Update", "Quartalsreview", "Vertragsverhandlung", "Produktpraesentation", "Reklamationsbearbeitung", "Schulung"};
        String[] vertragTitel = {"Servicevertrag", "Lizenzvertrag", "Wartungsvertrag", "Beratungsvertrag", "Rahmenvertrag", "SLA-Vertrag"};
        String[] chanceTitel = {"Neukundengewinnung", "Upselling", "Erweiterungsprojekt", "Systemwechsel", "Digitalisierung"};
        VertragStatus[] vertragStatuses = VertragStatus.values();
        ChancePhase[] phasen = ChancePhase.values();
        AktivitaetTyp[] aktivitaetTypen = AktivitaetTyp.values();
        GehaltTyp[] gehaltTypen = GehaltTyp.values();

        // 1. Create 100 Firmen
        List<Firma> firmen = new ArrayList<>();
        for (String name : firmaNames) {
            Firma f = new Firma();
            f.setName(name);
            f.setIndustry(industries[random.nextInt(industries.length)]);
            String domain = name.toLowerCase().replaceAll("[^a-z0-9]", "") ;
            f.setWebsite("www." + domain + ".de");
            f.setPhone("+49 " + (random.nextInt(900) + 100) + " " + (random.nextInt(9000000) + 1000000));
            f.setEmail("info@" + domain + ".de");
            f.setNotes(random.nextBoolean() ? "Wichtiger Kunde" : null);
            firmen.add(f);
        }
        firmen = firmaRepository.saveAll(firmen);
        firmaRepository.flush();

        // 2. Create ~250 Abteilungen (2-3 per Firma)
        List<Abteilung> abteilungen = new ArrayList<>();
        for (Firma firma : firmen) {
            int count = 2 + random.nextInt(2); // 2 or 3
            List<Integer> usedIndices = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                int idx;
                do { idx = random.nextInt(abteilungNames.length); } while (usedIndices.contains(idx));
                usedIndices.add(idx);
                Abteilung a = new Abteilung();
                a.setName(abteilungNames[idx]);
                a.setDescription("Abteilung " + abteilungNames[idx] + " der " + firma.getName());
                a.setFirma(firma);
                abteilungen.add(a);
            }
        }
        abteilungen = abteilungRepository.saveAll(abteilungen);
        abteilungRepository.flush();

        // 3. Create ~600 Personen (~6 per Firma)
        List<Person> personen = new ArrayList<>();
        for (Firma firma : firmen) {
            List<Abteilung> firmaAbt = abteilungen.stream().filter(a -> a.getFirma().getId().equals(firma.getId())).toList();
            int count = 5 + random.nextInt(3); // 5-7
            for (int i = 0; i < count; i++) {
                Person p = new Person();
                String fn = firstNames[random.nextInt(firstNames.length)];
                String ln = lastNames[random.nextInt(lastNames.length)];
                p.setFirstName(fn);
                p.setLastName(ln);
                String domain = firma.getName().toLowerCase().replaceAll("[^a-z0-9]", "");
                p.setEmail(fn.toLowerCase() + "." + ln.toLowerCase() + "@" + domain + ".de");
                p.setPhone("+49 " + (random.nextInt(900) + 100) + " " + (random.nextInt(9000000) + 1000000));
                p.setPosition(positions[random.nextInt(positions.length)]);
                p.setNotes(random.nextInt(5) == 0 ? "VIP Kontakt" : null);
                p.setFirma(firma);
                if (!firmaAbt.isEmpty()) {
                    p.setAbteilung(firmaAbt.get(random.nextInt(firmaAbt.size())));
                }
                personen.add(p);
            }
        }
        personen = personRepository.saveAll(personen);
        personRepository.flush();

        // 4. Create 500 Adressen (200 Firma + 300 Person)
        List<Adresse> adressen = new ArrayList<>();
        for (int i = 0; i < 200; i++) {
            Adresse a = new Adresse();
            int ci = random.nextInt(cities.length);
            a.setStreet(streets[random.nextInt(streets.length)]);
            a.setHouseNumber(String.valueOf(random.nextInt(120) + 1));
            a.setPostalCode(postalCodes[ci]);
            a.setCity(cities[ci]);
            a.setCountry("Deutschland");
            a.setFirma(firmen.get(random.nextInt(firmen.size())));
            adressen.add(a);
        }
        for (int i = 0; i < 300; i++) {
            Adresse a = new Adresse();
            int ci = random.nextInt(cities.length);
            a.setStreet(streets[random.nextInt(streets.length)]);
            a.setHouseNumber(String.valueOf(random.nextInt(120) + 1));
            a.setPostalCode(postalCodes[ci]);
            a.setCity(cities[ci]);
            a.setCountry("Deutschland");
            a.setPerson(personen.get(random.nextInt(personen.size())));
            adressen.add(a);
        }
        adresseRepository.saveAll(adressen);
        adresseRepository.flush();

        // 5. Create 600 Gehaelter (~2 per Person)
        List<Gehalt> gehaelter = new ArrayList<>();
        for (Person person : personen) {
            Gehalt g1 = new Gehalt();
            g1.setAmount(BigDecimal.valueOf(35000 + random.nextInt(60000)));
            g1.setCurrency("EUR");
            g1.setEffectiveDate(today.minusDays(random.nextInt(1095)));
            g1.setTyp(GehaltTyp.GRUNDGEHALT);
            g1.setPerson(person);
            gehaelter.add(g1);

            if (random.nextBoolean()) {
                Gehalt g2 = new Gehalt();
                g2.setAmount(BigDecimal.valueOf(1000 + random.nextInt(14000)));
                g2.setCurrency("EUR");
                g2.setEffectiveDate(today.minusDays(random.nextInt(365)));
                g2.setTyp(gehaltTypen[1 + random.nextInt(gehaltTypen.length - 1)]); // BONUS, PROVISION, or SONDERZAHLUNG
                g2.setPerson(person);
                gehaelter.add(g2);
            }
        }
        gehaltRepository.saveAll(gehaelter);
        gehaltRepository.flush();

        // 6. Create 1000 Aktivitaeten
        List<Aktivitaet> aktivitaeten = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            Aktivitaet ak = new Aktivitaet();
            ak.setTyp(aktivitaetTypen[random.nextInt(aktivitaetTypen.length)]);
            Firma firma = firmen.get(random.nextInt(firmen.size()));
            Person person = personen.get(random.nextInt(personen.size()));
            ak.setSubject(aktivitaetSubjects[random.nextInt(aktivitaetSubjects.length)] + " - " + firma.getName());
            ak.setDescription("Aktivitaet bezueglich " + person.getFirstName() + " " + person.getLastName());
            ak.setDatum(LocalDateTime.now().minusDays(random.nextInt(180)).minusHours(random.nextInt(8)));
            int choice = random.nextInt(3);
            if (choice == 0) { ak.setFirma(firma); }
            else if (choice == 1) { ak.setPerson(person); }
            else { ak.setFirma(firma); ak.setPerson(person); }
            aktivitaeten.add(ak);
        }
        aktivitaetRepository.saveAll(aktivitaeten);
        aktivitaetRepository.flush();

        // 7. Create 200 Vertraege
        List<Vertrag> vertraege = new ArrayList<>();
        for (int i = 0; i < 200; i++) {
            Vertrag v = new Vertrag();
            v.setTitel(vertragTitel[random.nextInt(vertragTitel.length)] + " #" + (i + 1));
            v.setWert(BigDecimal.valueOf(5000 + random.nextInt(495000)));
            v.setCurrency("EUR");
            // Status distribution: ~40% AKTIV, ~20% ENTWURF, ~20% ABGELAUFEN, ~20% GEKUENDIGT
            int statusRoll = random.nextInt(10);
            if (statusRoll < 4) v.setStatus(VertragStatus.AKTIV);
            else if (statusRoll < 6) v.setStatus(VertragStatus.ENTWURF);
            else if (statusRoll < 8) v.setStatus(VertragStatus.ABGELAUFEN);
            else v.setStatus(VertragStatus.GEKUENDIGT);
            LocalDate start = today.minusDays(random.nextInt(730));
            v.setStartDate(start);
            v.setEndDate(start.plusDays(365 + random.nextInt(730)));
            v.setNotes(random.nextInt(3) == 0 ? "Automatische Verlaengerung" : null);
            v.setFirma(firmen.get(random.nextInt(firmen.size())));
            if (random.nextBoolean()) {
                v.setKontaktPerson(personen.get(random.nextInt(personen.size())));
            }
            vertraege.add(v);
        }
        vertragRepository.saveAll(vertraege);
        vertragRepository.flush();

        // 8. Create 50 Produkte
        String[] produktNames = {"CRM Enterprise", "CRM Professional", "CRM Starter", "Cloud Hosting Basic", "Cloud Hosting Premium", "Cloud Hosting Enterprise", "Datenbank-Lizenz Standard", "Datenbank-Lizenz Enterprise", "API Gateway", "Monitoring Service", "Backup-Loesung", "Firewall Advanced", "E-Mail Suite", "Collaboration Platform", "Dokumentenmanagement", "ERP-Modul Finanzen", "ERP-Modul Logistik", "ERP-Modul Personal", "Wartungsvertrag Standard", "Wartungsvertrag Premium", "Support Basic", "Support Premium", "Support Enterprise", "Schulung Grundkurs", "Schulung Expertenkurs", "Beratung Digitalisierung", "Beratung Prozessoptimierung", "Beratung IT-Strategie", "Server Rack Unit", "Netzwerk-Switch 48-Port", "Router Enterprise", "Storage Array 10TB", "Storage Array 50TB", "Workstation Pro", "Laptop Business", "Monitor 4K", "Drucker Laser", "Scanner Dokumenten", "USV Anlage", "Klimaanlage Serverraum", "VPN-Lizenz", "Antivirus-Lizenz", "Office-Suite", "Projektmanagement-Tool", "Analytics Dashboard", "BI-Reporting-Modul", "IoT Gateway", "Sensoren-Kit", "Mobile App Lizenz", "Desktop App Lizenz"};
        String[] einheiten = {"Lizenz", "Stueck", "Monat", "Jahr", "Stunde", "Pauschal", "pro User"};
        ProduktKategorie[] kategorien = ProduktKategorie.values();
        List<Produkt> produkte = new ArrayList<>();
        for (int i = 0; i < produktNames.length; i++) {
            Produkt p = new Produkt();
            p.setName(produktNames[i]);
            p.setBeschreibung("Beschreibung fuer " + produktNames[i]);
            p.setProduktNummer("PRD-" + String.format("%04d", i + 1));
            p.setPreis(BigDecimal.valueOf(100 + random.nextInt(49900)));
            p.setCurrency("EUR");
            p.setEinheit(einheiten[random.nextInt(einheiten.length)]);
            // Assign kategorie based on product name pattern
            if (i < 3) p.setKategorie(ProduktKategorie.SOFTWARE);
            else if (i < 6) p.setKategorie(ProduktKategorie.DIENSTLEISTUNG);
            else if (i < 8) p.setKategorie(ProduktKategorie.LIZENZ);
            else if (i < 12) p.setKategorie(ProduktKategorie.SOFTWARE);
            else if (i < 18) p.setKategorie(ProduktKategorie.SOFTWARE);
            else if (i < 21) p.setKategorie(ProduktKategorie.WARTUNG);
            else if (i < 24) p.setKategorie(ProduktKategorie.WARTUNG);
            else if (i < 26) p.setKategorie(ProduktKategorie.DIENSTLEISTUNG);
            else if (i < 29) p.setKategorie(ProduktKategorie.DIENSTLEISTUNG);
            else if (i < 40) p.setKategorie(ProduktKategorie.HARDWARE);
            else if (i < 46) p.setKategorie(ProduktKategorie.LIZENZ);
            else p.setKategorie(kategorien[random.nextInt(kategorien.length)]);
            p.setAktiv(random.nextInt(10) > 0); // ~90% active
            produkte.add(p);
        }
        produktRepository.saveAll(produkte);
        produktRepository.flush();

        // 9. Create 300 Chancen
        List<Chance> chancen = new ArrayList<>();
        for (int i = 0; i < 300; i++) {
            Chance c = new Chance();
            Firma firma = firmen.get(random.nextInt(firmen.size()));
            c.setTitel(chanceTitel[random.nextInt(chanceTitel.length)] + " - " + firma.getName());
            c.setBeschreibung("Opportunity fuer " + firma.getName());
            c.setWert(BigDecimal.valueOf(10000 + random.nextInt(290000)));
            c.setCurrency("EUR");
            ChancePhase phase = phasen[random.nextInt(phasen.length)];
            c.setPhase(phase);
            // Wahrscheinlichkeit correlated with phase
            int wk = switch (phase) {
                case NEU -> 10 + random.nextInt(11);
                case QUALIFIZIERT -> 30 + random.nextInt(21);
                case ANGEBOT -> 50 + random.nextInt(21);
                case VERHANDLUNG -> 60 + random.nextInt(21);
                case GEWONNEN -> 100;
                case VERLOREN -> 0;
            };
            c.setWahrscheinlichkeit(wk);
            c.setErwartetesDatum(today.minusDays(random.nextInt(365)).plusDays(random.nextInt(365)));
            c.setFirma(firma);
            if (random.nextBoolean()) {
                c.setKontaktPerson(personen.get(random.nextInt(personen.size())));
            }
            chancen.add(c);
        }
        chanceRepository.saveAll(chancen);
        chanceRepository.flush();

        System.out.println("=== DataSeeder: " + firmen.size() + " Firmen, " + abteilungen.size() + " Abteilungen, " + personen.size() + " Personen, " + adressen.size() + " Adressen, " + gehaelter.size() + " Gehaelter, " + aktivitaeten.size() + " Aktivitaeten, " + vertraege.size() + " Vertraege, " + produkte.size() + " Produkte, " + chancen.size() + " Chancen erstellt ===");
    }

}
