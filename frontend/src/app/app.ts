import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { ChatWidgetComponent } from './features/assistant/chat-widget/chat-widget.component';
import { AuthService } from './core/services/auth.service';
import { LayoutService } from './core/services/layout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, NotificationComponent, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private authService = inject(AuthService);
  layoutService = inject(LayoutService);
  isAuthenticated = this.authService.isAuthenticated;
  showAssistant = computed(() => this.authService.hasPermission('CRM_ASSISTENT'));
}
