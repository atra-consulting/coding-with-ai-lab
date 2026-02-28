import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FaIconComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);

  faDatabase = faDatabase;
  faSignOutAlt = faSignOutAlt;

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.vorname} ${user.nachname}` : '';
  });

  logout(): void {
    this.authService.logout();
  }
}
