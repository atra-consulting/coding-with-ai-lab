import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FaIconComponent, NgbDropdownModule, TranslateModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  langService = inject(LanguageService);

  faDatabase = faDatabase;
  faSignOutAlt = faSignOutAlt;

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.vorname} ${user.nachname}` : '';
  });

  switchLanguage(lang: string): void {
    this.langService.setLanguage(lang);
  }

  logout(): void {
    this.authService.logout();
  }
}
