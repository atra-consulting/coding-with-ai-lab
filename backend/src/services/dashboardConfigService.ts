import { sqlite } from '../config/db.js';

export interface DashboardConfigDTO {
  visibleWidgets: string[];
}

interface DashboardConfigRow {
  id: number;
  benutzerId: number;
  visibleWidgets: string;
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
      visibleWidgets = JSON.parse(row.visibleWidgets) as string[];
    } catch {
      visibleWidgets = [];
    }

    return { visibleWidgets };
  },

  saveConfig(benutzerId: number, dto: DashboardConfigDTO): DashboardConfigDTO {
    const now = new Date().toISOString();
    const widgetsJson = JSON.stringify(dto.visibleWidgets);

    // Upsert: INSERT OR REPLACE
    sqlite
      .prepare(
        `INSERT INTO dashboardConfig (benutzerId, visibleWidgets, createdAt, updatedAt)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(benutzerId) DO UPDATE SET visibleWidgets=excluded.visibleWidgets, updatedAt=excluded.updatedAt`
      )
      .run(benutzerId, widgetsJson, now, now);

    return { visibleWidgets: dto.visibleWidgets };
  },
};
