import { sqlite } from '../config/db.js';
import type { AktivitaetDTO } from './aktivitaetService.js';

export interface TopFirmaDTO {
  id: number;
  name: string;
  personenCount: number;
  vertragswert: number;
}

export interface DepartmentSalaryDTO {
  departmentName: string;
  averageSalary: number;
}

export interface DashboardStatsDTO {
  firmenCount: number;
  personenCount: number;
  aktivitaetenCount: number;
  offeneChancenCount: number;
  gesamtVertragswert: number;
  durchschnittsGehalt: number;
  recentAktivitaeten: AktivitaetDTO[];
  topFirmen: TopFirmaDTO[];
  salaryByDepartment: DepartmentSalaryDTO[];
}

const CLOSED_PHASES = ['GEWONNEN', 'VERLOREN'];

export const dashboardService = {
  getStats(roles: string[] = []): DashboardStatsDTO {
    const canSeeSalary = roles.some((r) => r === 'ADMIN' || r === 'PERSONAL');
    const firmenCount = Number(
      (sqlite.prepare('SELECT COUNT(*) AS cnt FROM firma').get() as { cnt: number }).cnt
    );
    const personenCount = Number(
      (sqlite.prepare('SELECT COUNT(*) AS cnt FROM person').get() as { cnt: number }).cnt
    );
    const aktivitaetenCount = Number(
      (sqlite.prepare('SELECT COUNT(*) AS cnt FROM aktivitaet').get() as { cnt: number }).cnt
    );

    const placeholders = CLOSED_PHASES.map(() => '?').join(',');
    const offeneChancenCount = Number(
      (
        sqlite
          .prepare(`SELECT COUNT(*) AS cnt FROM chance WHERE phase NOT IN (${placeholders})`)
          .get(...CLOSED_PHASES) as { cnt: number }
      ).cnt
    );

    const vertragswertRow = sqlite
      .prepare(`SELECT COALESCE(SUM(wert), 0) AS total FROM vertrag WHERE status = 'AKTIV'`)
      .get() as { total: number };
    const gesamtVertragswert = Number(vertragswertRow.total);

    const gehaltRow = sqlite
      .prepare('SELECT COALESCE(AVG(amount), 0) AS avg FROM gehalt')
      .get() as { avg: number };
    const durchschnittsGehalt = Number(gehaltRow.avg);

    const recentAktivitaeten = this.getRecentActivities();
    const topFirmen = this.getTopCompanies();
    const salaryByDepartment = canSeeSalary ? this.getSalaryStatistics() : [];

    return {
      firmenCount,
      personenCount,
      aktivitaetenCount,
      offeneChancenCount,
      gesamtVertragswert,
      durchschnittsGehalt,
      recentAktivitaeten,
      topFirmen,
      salaryByDepartment,
    };
  },

  getRecentActivities(): AktivitaetDTO[] {
    const rows = sqlite
      .prepare(
        `SELECT ak.id, ak.typ, ak.subject, ak.description, ak.datum,
                ak.firmaId, f.name AS firmaName,
                ak.personId, p.firstName AS personFirstName, p.lastName AS personLastName,
                ak.createdAt, ak.updatedAt
         FROM aktivitaet ak
         LEFT JOIN firma f ON ak.firmaId = f.id
         LEFT JOIN person p ON ak.personId = p.id
         ORDER BY ak.datum DESC LIMIT 10`
      )
      .all() as Array<{
        id: number;
        typ: string;
        subject: string;
        description: string | null;
        datum: string;
        firmaId: number | null;
        firmaName: string | null;
        personId: number | null;
        personFirstName: string | null;
        personLastName: string | null;
        createdAt: string;
        updatedAt: string;
      }>;

    return rows.map((row) => ({
      id: row.id,
      typ: row.typ,
      subject: row.subject,
      description: row.description,
      datum: row.datum,
      firmaId: row.firmaId,
      firmaName: row.firmaName,
      personId: row.personId,
      personName:
        row.personFirstName && row.personLastName
          ? `${row.personFirstName} ${row.personLastName}`
          : row.personFirstName ?? row.personLastName ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  getSalaryStatistics(): DepartmentSalaryDTO[] {
    const rows = sqlite
      .prepare(
        `SELECT COALESCE(a.name, 'Keine Abteilung') AS departmentName,
                AVG(g.amount) AS averageSalary
         FROM gehalt g
         LEFT JOIN person p ON g.personId = p.id
         LEFT JOIN abteilung a ON p.abteilungId = a.id
         GROUP BY a.id, a.name
         ORDER BY averageSalary DESC`
      )
      .all() as { departmentName: string; averageSalary: number }[];

    return rows.map((row) => ({
      departmentName: row.departmentName,
      averageSalary: Number(row.averageSalary),
    }));
  },

  getTopCompanies(): TopFirmaDTO[] {
    const rows = sqlite
      .prepare(
        `SELECT f.id, f.name,
                COUNT(DISTINCT p.id) AS personenCount,
                COALESCE(SUM(v.wert), 0) AS vertragswert
         FROM firma f
         LEFT JOIN person p ON p.firmaId = f.id
         LEFT JOIN vertrag v ON v.firmaId = f.id AND v.status = 'AKTIV'
         GROUP BY f.id, f.name
         ORDER BY vertragswert DESC
         LIMIT 5`
      )
      .all() as { id: number; name: string; personenCount: number; vertragswert: number }[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      personenCount: Number(row.personenCount),
      vertragswert: Number(row.vertragswert),
    }));
  },
};
