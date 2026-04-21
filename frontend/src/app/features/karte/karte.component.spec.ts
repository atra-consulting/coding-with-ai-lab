import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { KarteComponent, buildPopupHtml } from './karte.component';
import { KarteService } from '../../core/services/karte.service';
import { LeafletMapFactory } from '../../core/services/leaflet-map.factory';
import { MapMarker } from '../../core/models/map-marker';

describe('KarteComponent', () => {
  let fixture: ComponentFixture<KarteComponent>;
  let mockKarteService: jasmine.SpyObj<KarteService>;
  let mockMapFactory: jasmine.SpyObj<LeafletMapFactory>;
  let fakeMap: { setView: jasmine.Spy; fitBounds: jasmine.Spy; remove: jasmine.Spy };
  let fakeGroup: {
    addTo: jasmine.Spy;
    getBounds: jasmine.Spy;
  };

  function setUpTest(markersObservable: Observable<MapMarker[]>): void {
    mockKarteService = jasmine.createSpyObj<KarteService>('KarteService', ['getMarkers']);
    mockKarteService.getMarkers.and.returnValue(markersObservable);

    fakeMap = {
      setView: jasmine.createSpy('setView'),
      fitBounds: jasmine.createSpy('fitBounds'),
      remove: jasmine.createSpy('remove'),
    };
    fakeGroup = {
      addTo: jasmine.createSpy('addTo').and.callFake(() => fakeGroup),
      getBounds: jasmine.createSpy('getBounds').and.returnValue({}),
    };

    mockMapFactory = jasmine.createSpyObj<LeafletMapFactory>('LeafletMapFactory', [
      'createMap',
      'addTileLayer',
      'createMarker',
      'createFeatureGroup',
    ]);
    mockMapFactory.createMap.and.returnValue(fakeMap as never);
    mockMapFactory.addTileLayer.and.returnValue({} as never);
    mockMapFactory.createFeatureGroup.and.returnValue(fakeGroup as never);
    mockMapFactory.createMarker.and.callFake(
      () =>
        ({
          addTo: jasmine.createSpy('addTo').and.callFake(function () {
            return this;
          }),
        }) as never
    );

    TestBed.configureTestingModule({
      imports: [KarteComponent],
      providers: [
        { provide: KarteService, useValue: mockKarteService },
        { provide: LeafletMapFactory, useValue: mockMapFactory },
      ],
    });

    fixture = TestBed.createComponent(KarteComponent);
    fixture.detectChanges();
  }

  function sampleMarker(partial?: Partial<MapMarker>): MapMarker {
    return {
      id: 1,
      street: 'Teststr.',
      houseNumber: '1',
      postalCode: '10115',
      city: 'Berlin',
      latitude: 52.5,
      longitude: 13.4,
      firmaId: 99,
      firmaName: 'ACME GmbH',
      ...partial,
    };
  }

  describe('with three markers', () => {
    beforeEach(fakeAsync(() => {
      const markers = [
        sampleMarker({ id: 1 }),
        sampleMarker({ id: 2, latitude: 48.1, longitude: 11.6 }),
        sampleMarker({ id: 3, latitude: 50.1, longitude: 8.7 }),
      ];
      setUpTest(of(markers));
      flush();
      fixture.detectChanges();
    }));

    it('renders the marker count badge', () => {
      const badge: HTMLElement | null = fixture.nativeElement.querySelector(
        '[data-testid="marker-count"]'
      );
      expect(badge?.textContent?.trim()).toBe('3 Adressen');
    });

    it('calls LeafletMapFactory.createMarker once per marker', () => {
      expect(mockMapFactory.createMarker).toHaveBeenCalledTimes(3);
    });

    it('fits bounds to the marker group', () => {
      expect(fakeMap.fitBounds).toHaveBeenCalled();
    });

    it('does not render the error alert or empty state', () => {
      expect(fixture.nativeElement.querySelector('[data-testid="error-alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="empty-state"]')).toBeNull();
    });
  });

  describe('with zero markers', () => {
    beforeEach(fakeAsync(() => {
      setUpTest(of([]));
      flush();
      fixture.detectChanges();
    }));

    it('renders the empty-state message', () => {
      const empty: HTMLElement | null = fixture.nativeElement.querySelector(
        '[data-testid="empty-state"]'
      );
      expect(empty).not.toBeNull();
      expect(empty?.textContent?.trim()).toContain('Keine Adressen mit Koordinaten vorhanden.');
    });

    it('does NOT call createMarker', () => {
      expect(mockMapFactory.createMarker).not.toHaveBeenCalled();
    });

    it('centers on Germany', () => {
      expect(fakeMap.setView).toHaveBeenCalledWith([51.1657, 10.4515], 6);
    });
  });

  describe('on service error', () => {
    beforeEach(fakeAsync(() => {
      setUpTest(throwError(() => new Error('boom')));
      flush();
      fixture.detectChanges();
    }));

    it('renders the error alert', () => {
      const alert: HTMLElement | null = fixture.nativeElement.querySelector(
        '[data-testid="error-alert"]'
      );
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain('Karte konnte nicht geladen werden');
    });

    it('does NOT initialize the map', () => {
      expect(mockMapFactory.createMap).not.toHaveBeenCalled();
    });

    it('does NOT render the map container', () => {
      expect(fixture.nativeElement.querySelector('[data-testid="map-container"]')).toBeNull();
    });
  });
});

describe('buildPopupHtml', () => {
  const base = {
    id: 1,
    street: 'Unter den Linden',
    houseNumber: '1',
    postalCode: '10117',
    city: 'Berlin',
    latitude: 52.5,
    longitude: 13.4,
    firmaId: 42,
    firmaName: 'ACME GmbH',
  };

  it('includes a link to the Firma detail page when firmaId is set', () => {
    const html = buildPopupHtml(base);
    expect(html).toContain('<a href="/firmen/42">ACME GmbH</a>');
    expect(html).toContain('Unter den Linden 1');
    expect(html).toContain('10117 Berlin');
  });

  it('omits the firma line when firmaId and firmaName are both null', () => {
    const html = buildPopupHtml({ ...base, firmaId: null, firmaName: null });
    expect(html).not.toContain('<strong>');
    expect(html).toContain('Unter den Linden 1');
  });

  it('HTML-escapes firmaName to prevent XSS', () => {
    const html = buildPopupHtml({
      ...base,
      firmaName: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('HTML-escapes street, city, and postalCode', () => {
    const html = buildPopupHtml({
      ...base,
      street: '<b>Str</b>',
      city: '"Berlin"',
      postalCode: "'10117'",
    });
    expect(html).toContain('&lt;b&gt;Str&lt;/b&gt;');
    expect(html).toContain('&quot;Berlin&quot;');
    expect(html).toContain('&#39;10117&#39;');
  });

  it('skips empty street/city lines gracefully', () => {
    const html = buildPopupHtml({
      ...base,
      street: null,
      houseNumber: null,
      postalCode: null,
      city: 'Berlin',
    });
    expect(html).toContain('Berlin');
    expect(html).not.toContain('<br><br>');
  });
});
