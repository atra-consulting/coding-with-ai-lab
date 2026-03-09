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
import com.crm.entity.Vertrag;
import com.crm.entity.enums.AktivitaetTyp;
import com.crm.entity.enums.ChancePhase;
import com.crm.entity.enums.GehaltTyp;
import com.crm.entity.enums.VertragStatus;
import com.crm.repository.AbteilungRepository;
import com.crm.repository.AdresseRepository;
import com.crm.repository.AktivitaetRepository;
import com.crm.repository.ChanceRepository;
import com.crm.repository.FirmaRepository;
import com.crm.repository.GehaltRepository;
import com.crm.repository.PersonRepository;
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

    public DataSeeder(FirmaRepository firmaRepository, AbteilungRepository abteilungRepository,
                      PersonRepository personRepository, AdresseRepository adresseRepository,
                      GehaltRepository gehaltRepository, AktivitaetRepository aktivitaetRepository,
                      VertragRepository vertragRepository, ChanceRepository chanceRepository) {
        this.firmaRepository = firmaRepository;
        this.abteilungRepository = abteilungRepository;
        this.personRepository = personRepository;
        this.adresseRepository = adresseRepository;
        this.gehaltRepository = gehaltRepository;
        this.aktivitaetRepository = aktivitaetRepository;
        this.vertragRepository = vertragRepository;
        this.chanceRepository = chanceRepository;
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

        // 4. Create Adressen — every Firma gets 1 real address, plus 300 Person-Adressen
        // Real German addresses (street + houseNumber + postalCode + city) that geocode correctly
        String[][] realAddresses = {
            {"Friedrichstraße", "43", "10117", "Berlin"},
            {"Unter den Linden", "77", "10117", "Berlin"},
            {"Alexanderplatz", "1", "10178", "Berlin"},
            {"Kurfürstendamm", "21", "10719", "Berlin"},
            {"Potsdamer Platz", "1", "10785", "Berlin"},
            {"Torstraße", "1", "10119", "Berlin"},
            {"Karl-Marx-Allee", "90", "10243", "Berlin"},
            {"Schönhauser Allee", "36", "10435", "Berlin"},
            {"Marienstraße", "26", "10117", "Berlin"},
            {"Oranienburger Straße", "32", "10117", "Berlin"},
            {"Leopoldstraße", "1", "80802", "München"},
            {"Maximilianstraße", "35", "80539", "München"},
            {"Kaufingerstraße", "12", "80331", "München"},
            {"Sendlinger Straße", "1", "80331", "München"},
            {"Neuhauser Straße", "2", "80331", "München"},
            {"Sonnenstraße", "20", "80331", "München"},
            {"Theresienstraße", "46", "80333", "München"},
            {"Ludwigstraße", "16", "80539", "München"},
            {"Brienner Straße", "7", "80333", "München"},
            {"Residenzstraße", "1", "80333", "München"},
            {"Jungfernstieg", "1", "20354", "Hamburg"},
            {"Mönckebergstraße", "7", "20095", "Hamburg"},
            {"Speersort", "1", "20095", "Hamburg"},
            {"Rathausmarkt", "1", "20095", "Hamburg"},
            {"Gänsemarkt", "33", "20354", "Hamburg"},
            {"Ballindamm", "40", "20095", "Hamburg"},
            {"Neuer Wall", "80", "20354", "Hamburg"},
            {"Große Bleichen", "21", "20354", "Hamburg"},
            {"Colonnaden", "5", "20354", "Hamburg"},
            {"ABC-Straße", "19", "20354", "Hamburg"},
            {"Schildergasse", "65", "50667", "Köln"},
            {"Hohe Straße", "52", "50667", "Köln"},
            {"Breite Straße", "80", "50667", "Köln"},
            {"Heumarkt", "12", "50667", "Köln"},
            {"Domkloster", "3", "50667", "Köln"},
            {"Zeil", "106", "60313", "Frankfurt am Main"},
            {"Kaiserstraße", "1", "60311", "Frankfurt am Main"},
            {"Neue Mainzer Straße", "52", "60311", "Frankfurt am Main"},
            {"Taunusanlage", "12", "60325", "Frankfurt am Main"},
            {"Große Bockenheimer Straße", "2", "60313", "Frankfurt am Main"},
            {"Königstraße", "26", "70173", "Stuttgart"},
            {"Calwer Straße", "11", "70173", "Stuttgart"},
            {"Schulstraße", "5", "70173", "Stuttgart"},
            {"Kronenstraße", "1", "70173", "Stuttgart"},
            {"Marktstraße", "4", "70173", "Stuttgart"},
            {"Königsallee", "30", "40212", "Düsseldorf"},
            {"Schadowstraße", "11", "40212", "Düsseldorf"},
            {"Bolkerstraße", "53", "40213", "Düsseldorf"},
            {"Heinrich-Heine-Allee", "1", "40213", "Düsseldorf"},
            {"Flinger Straße", "11", "40213", "Düsseldorf"},
            {"Grimmaische Straße", "2", "04109", "Leipzig"},
            {"Petersstraße", "36", "04109", "Leipzig"},
            {"Nikolaistraße", "14", "04109", "Leipzig"},
            {"Hainstraße", "12", "04109", "Leipzig"},
            {"Augustusplatz", "9", "04109", "Leipzig"},
            {"Kampstraße", "45", "44137", "Dortmund"},
            {"Westenhellweg", "102", "44137", "Dortmund"},
            {"Ostenhellweg", "1", "44135", "Dortmund"},
            {"Hansastraße", "61", "44137", "Dortmund"},
            {"Rheinoldistraße", "4", "44135", "Dortmund"},
            {"Kettwiger Straße", "36", "45127", "Essen"},
            {"Limbecker Straße", "1", "45127", "Essen"},
            {"Huyssenallee", "53", "45128", "Essen"},
            {"Rüttenscheider Straße", "1", "45130", "Essen"},
            {"Alfredstraße", "81", "45130", "Essen"},
            {"Obernstraße", "2", "28195", "Bremen"},
            {"Sögestraße", "18", "28195", "Bremen"},
            {"Am Wall", "102", "28195", "Bremen"},
            {"Langenstraße", "10", "28195", "Bremen"},
            {"Hutfilterstraße", "16", "28195", "Bremen"},
            {"Prager Straße", "2", "01069", "Dresden"},
            {"Wilsdruffer Straße", "2", "01067", "Dresden"},
            {"Altmarkt", "4", "01067", "Dresden"},
            {"Neumarkt", "2", "01067", "Dresden"},
            {"An der Kreuzkirche", "6", "01067", "Dresden"},
            {"Georgstraße", "36", "30159", "Hannover"},
            {"Bahnhofstraße", "5", "30159", "Hannover"},
            {"Karmarschstraße", "30", "30159", "Hannover"},
            {"Luisenstraße", "5", "30159", "Hannover"},
            {"Schmiedestraße", "1", "30159", "Hannover"},
            {"Königstraße", "23", "90402", "Nürnberg"},
            {"Breite Gasse", "25", "90402", "Nürnberg"},
            {"Karolinenstraße", "12", "90402", "Nürnberg"},
            {"Pfannenschmiedsgasse", "6", "90402", "Nürnberg"},
            {"Lorenzer Straße", "32", "90402", "Nürnberg"},
            {"Sonnenwall", "14", "47051", "Duisburg"},
            {"Königstraße", "48", "47051", "Duisburg"},
            {"Münzstraße", "9", "47051", "Duisburg"},
            {"Kuhstraße", "4", "47051", "Duisburg"},
            {"Düsseldorfer Straße", "34", "47051", "Duisburg"},
            {"Marktplatz", "1", "76131", "Karlsruhe"},
            {"Kaiserstraße", "72", "76133", "Karlsruhe"},
            {"Waldstraße", "24", "76133", "Karlsruhe"},
            {"Karl-Friedrich-Straße", "14", "76133", "Karlsruhe"},
            {"Amalienstraße", "3", "76133", "Karlsruhe"},
            {"Hauptstraße", "120", "69117", "Heidelberg"},
            {"Sofienstraße", "12", "69115", "Heidelberg"},
            {"Bergheimer Straße", "1", "69115", "Heidelberg"},
            {"Bismarckplatz", "1", "69115", "Heidelberg"},
            {"Marstallstraße", "6", "69117", "Heidelberg"},
        };

        List<Adresse> adressen = new ArrayList<>();
        // Every Firma gets exactly 1 real address
        for (int i = 0; i < firmen.size(); i++) {
            Adresse a = new Adresse();
            String[] addr = realAddresses[i % realAddresses.length];
            a.setStreet(addr[0]);
            a.setHouseNumber(addr[1]);
            a.setPostalCode(addr[2]);
            a.setCity(addr[3]);
            a.setCountry("Deutschland");
            a.setFirma(firmen.get(i));
            adressen.add(a);
        }
        // Additional random Firma addresses (100 more, distributed randomly)
        for (int i = 0; i < 100; i++) {
            Adresse a = new Adresse();
            String[] addr = realAddresses[random.nextInt(realAddresses.length)];
            a.setStreet(addr[0]);
            a.setHouseNumber(addr[1]);
            a.setPostalCode(addr[2]);
            a.setCity(addr[3]);
            a.setCountry("Deutschland");
            a.setFirma(firmen.get(random.nextInt(firmen.size())));
            adressen.add(a);
        }
        for (int i = 0; i < 300; i++) {
            Adresse a = new Adresse();
            String[] addr = realAddresses[random.nextInt(realAddresses.length)];
            a.setStreet(addr[0]);
            a.setHouseNumber(addr[1]);
            a.setPostalCode(addr[2]);
            a.setCity(addr[3]);
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

        // 8. Create 300 Chancen
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

        System.out.println("=== DataSeeder: " + firmen.size() + " Firmen, " + abteilungen.size() + " Abteilungen, " + personen.size() + " Personen, " + adressen.size() + " Adressen, " + gehaelter.size() + " Gehaelter, " + aktivitaeten.size() + " Aktivitaeten, " + vertraege.size() + " Vertraege, " + chancen.size() + " Chancen erstellt ===");
    }

}
