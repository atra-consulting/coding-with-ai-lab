import { sqlite } from '../config/db.js';

export interface DashboardConfigDTO {
  visibleWidgets: string[];
}

interface DashboardConfigRow {
  id: number;
  benutzerId: number;
  config: string;
  createdAt: string;
  updatedAt: string;
}

export const dashboardConfigService = {
  getConfig(benutzerId: number): DashboardConfigDTO | null {
    const row = sqlite
      .prepare('SELECT * FROM dashboardConfig WHERE benutzerId = ?')
      .get(benutzerId) as DashboardConfigRow | undefined;

    if (!row) return null;

    let visibleWidgets: string[] = [];
    try {
      visibleWidgets = JSON.parse(row.config) as string[];
    } catch {
      visibleWidgets = [];
    }

    return { visibleWidgets };
  },

  saveConfig(benutzerId: number, dto: DashboardConfigDTO): DashboardConfigDTO {
    const now = new Date().toISOString();
    const configJson = JSON.stringify(dto.visibleWidgets);

    // Upsert: INSERT OR REPLACE
    sqlite
      .prepare(
        `INSERT INTO dashboardConfig (benutzerId, config, createdAt, updatedAt)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(benutzerId) DO UPDATE SET config=excluded.config, updatedAt=excluded.updatedAt`
      )
      .run(benutzerId, configJson, now, now);

    return { visibleWidgets: dto.visibleWidgets };
  },
};
