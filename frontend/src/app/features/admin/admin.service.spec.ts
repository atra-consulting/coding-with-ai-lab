import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { GeocodeResult } from '../../core/models/geocode-result.model';

describe('AdminService', () => {
  let service: AdminService;
  let httpController: HttpTestingController;

  const mockResult: GeocodeResult = {
    total: 10,
    succeeded: 8,
    failed: 1,
    skippedInsufficientData: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('geocodeAddresses() fires POST to /api/admin/geocode-addresses without params', () => {
    service.geocodeAddresses().subscribe();

    const req = httpController.expectOne('/api/admin/geocode-addresses');
    expect(req.request.method).toBe('POST');
    expect(req.request.url).toBe('/api/admin/geocode-addresses');
    expect(req.request.params.keys()).toEqual([]);
    expect(req.request.body).toEqual({});
    req.flush(mockResult);
  });

  it('geocodeAddresses(true) fires POST with force=true query param', () => {
    service.geocodeAddresses(true).subscribe();

    const req = httpController.expectOne(
      (r) => r.url === '/api/admin/geocode-addresses' && r.params.get('force') === 'true',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(mockResult);
  });

  it('geocodeAddresses() emits the server response', () => {
    let received: GeocodeResult | undefined;
    service.geocodeAddresses().subscribe((r) => (received = r));

    httpController.expectOne('/api/admin/geocode-addresses').flush(mockResult);

    expect(received).toEqual(mockResult);
  });
});
