import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FirmaListComponent } from './firma-list.component';
import { FirmaService } from '../../../core/services/firma.service';

describe('FirmaListComponent', () => {
  let fixture: ComponentFixture<FirmaListComponent>;
  let component: FirmaListComponent;
  let mockFirmaService: jasmine.SpyObj<FirmaService>;

  beforeEach(async () => {
    mockFirmaService = jasmine.createSpyObj('FirmaService', ['listAll']);
    mockFirmaService.listAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FirmaListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FirmaService, useValue: mockFirmaService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FirmaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call listAll on init', () => {
    expect(mockFirmaService.listAll).toHaveBeenCalledTimes(1);
  });

  it('should include a phone column in columnDefs', () => {
    const phoneCol = component.columnDefs.find((col) => col.field === 'phone');
    expect(phoneCol).toBeDefined();
  });

  it('should label the phone column as Telefon', () => {
    const phoneCol = component.columnDefs.find((col) => col.field === 'phone');
    expect(phoneCol?.headerName).toBe('Telefon');
  });
});
