import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dashboard stats', () => {
    const mockStats = {
      firmenCount: 10,
      personenCount: 50,
      aktivitaetenCount: 100,
      offeneChancenCount: 5,
      gesamtVertragswert: 250000,
      durchschnittsGehalt: 55000,
      recentAktivitaeten: [],
      topFirmen: [],
      salaryByDepartment: [],
    };

    service.getStats().subscribe((stats) => {
      expect(stats.firmenCount).toBe(10);
      expect(stats.personenCount).toBe(50);
      expect(stats.gesamtVertragswert).toBe(250000);
    });

    const req = httpMock.expectOne('/api/dashboard/stats');
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should fetch recent activities', () => {
    const mockActivities = [
      {
        id: 1,
        typ: 'ANRUF',
        subject: 'Kundengespräch',
        description: '',
        datum: '2024-01-15',
        createdAt: '2024-01-15T10:00:00',
        firmaId: 1,
        firmaName: 'Test GmbH',
        personId: null,
        personName: null,
      },
    ];

    service.getRecentActivities().subscribe((activities) => {
      expect(activities.length).toBe(1);
      expect(activities[0].typ).toBe('ANRUF');
      expect(activities[0].subject).toBe('Kundengespräch');
    });

    const req = httpMock.expectOne('/api/dashboard/recent-activities');
    expect(req.request.method).toBe('GET');
    req.flush(mockActivities);
  });

  it('should fetch salary statistics', () => {
    const mockSalaries = [
      { departmentName: 'Vertrieb', averageSalary: 60000 },
      { departmentName: 'Entwicklung', averageSalary: 70000 },
    ];

    service.getSalaryStatistics().subscribe((salaries) => {
      expect(salaries.length).toBe(2);
      expect(salaries[0].departmentName).toBe('Vertrieb');
      expect(salaries[1].averageSalary).toBe(70000);
    });

    const req = httpMock.expectOne('/api/dashboard/salary-statistics');
    expect(req.request.method).toBe('GET');
    req.flush(mockSalaries);
  });

  it('should fetch top companies', () => {
    const mockCompanies = [
      { id: 1, name: 'Firma A', personenCount: 20, vertragswert: 100000 },
      { id: 2, name: 'Firma B', personenCount: 15, vertragswert: 80000 },
    ];

    service.getTopCompanies().subscribe((companies) => {
      expect(companies.length).toBe(2);
      expect(companies[0].name).toBe('Firma A');
      expect(companies[1].personenCount).toBe(15);
    });

    const req = httpMock.expectOne('/api/dashboard/top-companies');
    expect(req.request.method).toBe('GET');
    req.flush(mockCompanies);
  });
});
