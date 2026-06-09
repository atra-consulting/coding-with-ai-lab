# CRM Database Specification

Column definitions, entity schemas, enums, foreign keys, migration approach, and ORM/driver versions for the CRM SQLite database.

Cross-references:
- Operational facts (DB engine, file path, startup): see [SPECS-infrastructure.md](SPECS-infrastructure.md)
- API routes, sort-field whitelists, DTO fields, code patterns: see [SPECS-backend.md](SPECS-backend.md)

## Runtime Versions

<!-- mirror: keep in sync with SPECS.md / SPECS-infrastructure.md stack table -->

| Library | Version |
|---------|---------|
| better-sqlite3 | 9.6 |
| drizzle-orm | 0.41 |

## Schema Files

| Purpose | Path |
|---------|------|
| Drizzle table definitions | `backend/src/db/schema/schema.ts` |
| TypeScript enum arrays and types | `backend/src/db/schema/enums.ts` |
| Migration statements (DDL) | `backend/src/config/migrate.ts` |

Migration approach: plain `CREATE TABLE IF NOT EXISTS` statements. Run on every startup before seed data is loaded.

## Tables

The database contains 8 tables: `firma`, `person`, `abteilung`, `adresse`, `gehalt`, `aktivitaet`, `vertrag`, `chance`.

## Storage Rules

- All tables use `integer` PKs with autoincrement.
- All timestamps are `text` columns storing ISO-8601 strings.
- Monetary values (`wert`, `amount`) use SQLite `REAL`.
- Foreign keys enforce referential integrity.
- `PRAGMA foreign_keys = ON` is set on every connection (see `backend/src/config/db.ts`). Required for cascade deletes to work.

## Entities

### Firma

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL |
| industry | text | nullable |
| website | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| notes | text | nullable |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

Cascade deletes to: Person, Abteilung, Adresse, Aktivitaet, Vertrag, Chance.

### Person

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| firstName | text | NOT NULL |
| lastName | text | NOT NULL |
| email | text | nullable |
| phone | text | nullable |
| position | text | nullable |
| notes | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| abteilungId | integer | nullable, FK → abteilung(id) SET NULL |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

Cascade deletes to: Adresse, Gehalt.

### Abteilung

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL |
| description | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Adresse

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| street | text | nullable |
| houseNumber | text | nullable |
| postalCode | text | nullable |
| city | text | nullable |
| country | text | nullable |
| firmaId | integer | nullable, FK → firma(id) CASCADE DELETE |
| personId | integer | nullable, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Gehalt

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| amount | real | NOT NULL |
| currency | text | NOT NULL, default `EUR` |
| typ | text | NOT NULL, default `GRUNDGEHALT` |
| effectiveDate | text | NOT NULL |
| personId | integer | NOT NULL, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Aktivitaet

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| typ | text | NOT NULL |
| subject | text | NOT NULL |
| description | text | nullable |
| datum | text | NOT NULL |
| firmaId | integer | nullable, FK → firma(id) CASCADE DELETE |
| personId | integer | nullable, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Vertrag

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| titel | text | NOT NULL |
| notes | text | nullable |
| wert | real | nullable |
| currency | text | NOT NULL, default `EUR` |
| status | text | NOT NULL, default `ENTWURF` |
| startDate | text | nullable |
| endDate | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| kontaktPersonId | integer | nullable, FK → person(id) SET NULL |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Chance

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| titel | text | NOT NULL |
| beschreibung | text | nullable |
| wert | real | nullable |
| currency | text | NOT NULL, default `EUR` |
| phase | text | NOT NULL, default `NEU` |
| wahrscheinlichkeit | integer | nullable, 0–100 |
| erwartetesDatum | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| kontaktPersonId | integer | nullable, FK → person(id) SET NULL |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

## Enums

<!-- mirror: keep in sync with SPECS-backend.md Validation section -->

Stored as plain `text` in SQLite. Validated by Zod on write. Defined in `backend/src/db/schema/enums.ts`.

| Enum | Values |
|------|--------|
| ChancePhase | NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN |
| VertragStatus | ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT |
| AktivitaetTyp | ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE |
| GehaltTyp | GRUNDGEHALT, BONUS, PROVISION, SONDERZAHLUNG |
