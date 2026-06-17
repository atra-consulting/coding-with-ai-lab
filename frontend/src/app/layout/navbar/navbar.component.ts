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
  private themeService = inject(ThemeService);

  faDatabase = faDatabase;
  faSignOutAlt = faSignOutAlt;

  isDark = computed(() => this.themeService.isDark());
  themeIcon = computed(() => this.themeService.isDark() ? faSun : faMoon);

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.vorname} ${user.nachname}` : '';
  });

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
