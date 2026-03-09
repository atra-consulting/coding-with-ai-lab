import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default collapsed state as false', () => {
    expect(service.collapsed()).toBeFalse();
  });

  it('should toggle collapsed state', () => {
    service.toggleSidebar();
    expect(service.collapsed()).toBeTrue();
    service.toggleSidebar();
    expect(service.collapsed()).toBeFalse();
  });

  it('should load initial state from localStorage', () => {
    localStorage.setItem('sidebar_collapsed', 'true');
    // Re-inject the service to test initial load
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const newService = TestBed.inject(LayoutService);
    expect(newService.collapsed()).toBeTrue();
  });

  it('should persist state to localStorage when toggled', () => {
    service.toggleSidebar();
    TestBed.flushEffects();
    expect(localStorage.getItem('sidebar_collapsed')).toBe('true');
  });
});
