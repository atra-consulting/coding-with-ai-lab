import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faSignOutAlt, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FaIconComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  faDatabase = faDatabase;
  faSignOutAlt = faSignOutAlt;
  faMoon = faMoon;
  faSun = faSun;

  themeIcon = computed(() => this.themeService.isDark() ? faSun : faMoon);

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.vorname} ${user.nachname}` : '';
  });

  logout(): void {
    this.authService.logout();
  }
}
