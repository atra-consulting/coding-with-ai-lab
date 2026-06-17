import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  isDark = signal<boolean>(this.loadFromStorage());

  constructor() {
    this.applyTheme(this.isDark());
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.isDark()));
      this.applyTheme(this.isDark());
    });
  }

  toggleTheme(): void {
    this.isDark.set(!this.isDark());
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  }

  private loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }
}
