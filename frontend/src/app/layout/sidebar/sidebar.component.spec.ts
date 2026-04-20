import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { BenutzerInfo } from '../../core/models/auth.model';

describe('SidebarComponent', () => {
  const adminUser: BenutzerInfo = {
    id: 1,
    benutzername: 'admin',
    vorname: 'Admin',
    nachname: 'User',
    email: 'admin@test.de',
    rollen: ['ROLE_ADMIN', 'ROLE_USER'],
    permissions: [],
  };

  const regularUser: BenutzerInfo = {
    id: 2,
    benutzername: 'user',
    vorname: 'Regular',
    nachname: 'User',
    email: 'user@test.de',
    rollen: ['ROLE_USER'],
    permissions: [],
  };

  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let mockAuthService: { currentUser: ReturnType<typeof signal<BenutzerInfo | null>> };
  let mockLayoutService: { collapsed: ReturnType<typeof signal<boolean>>; toggleSidebar: jasmine.Spy };

  beforeEach(async () => {
    const userSignal = signal<BenutzerInfo | null>(null);
    const collapsedSignal = signal<boolean>(false);

    mockAuthService = {
      currentUser: userSignal,
    };

    mockLayoutService = {
      collapsed: collapsedSignal,
      toggleSidebar: jasmine.createSpy('toggleSidebar'),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: LayoutService, useValue: mockLayoutService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders item without requiredRole for any user', () => {
    mockAuthService.currentUser.set(regularUser);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dashboard');
  });

  it('renders item with requiredRole ADMIN when user has ADMIN role', () => {
    mockAuthService.currentUser.set(adminUser);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Adressen geokodieren');
  });

  it('hides item with requiredRole ADMIN when user only has USER role', () => {
    mockAuthService.currentUser.set(regularUser);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Adressen geokodieren');
  });

  it('does not render the Administration section header when all its items are hidden', () => {
    mockAuthService.currentUser.set(regularUser);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Administration');
  });

  it('renders the Administration section header when user has ADMIN role', () => {
    mockAuthService.currentUser.set(adminUser);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Administration');
  });
});
