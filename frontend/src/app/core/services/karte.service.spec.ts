import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { KarteService } from './karte.service';
import { MapMarker } from '../models/map-marker';

describe('KarteService', () => {
  let service: KarteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KarteService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KarteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /api/adressen/map-markers and returns the body unchanged', () => {
    const fake: MapMarker[] = [
      {
        id: 1,
        street: 'Teststr.',
        houseNumber: '1',
        postalCode: '10115',
        city: 'Berlin',
        latitude: 52.5,
        longitude: 13.4,
        firmaId: 2,
        firmaName: 'ACME GmbH',
      },
    ];

    let received: MapMarker[] | undefined;
    service.getMarkers().subscribe((m) => (received = m));

    const req = httpMock.expectOne('/api/adressen/map-markers');
    expect(req.request.method).toBe('GET');
    req.flush(fake);

    expect(received).toEqual(fake);
  });
});
