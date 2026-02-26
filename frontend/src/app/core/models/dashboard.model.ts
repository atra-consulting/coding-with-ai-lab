import { Aktivitaet } from './aktivitaet.model';

export interface DashboardStats {
  firmenCount: number;
  personenCount: number;
  aktivitaetenCount: number;
  offeneChancenCount: number;
  gesamtVertragswert: number;
  durchschnittsGehalt: number;
  recentAktivitaeten: Aktivitaet[];
  topFirmen: TopFirma[];
  salaryByDepartment: DepartmentSalary[];
}

export interface TopFirma {
  id: number;
  name: string;
  personenCount: number;
  vertragswert: number;
}

export interface DepartmentSalary {
  departmentName: string;
  averageSalary: number;
}
