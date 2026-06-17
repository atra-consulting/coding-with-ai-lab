import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  private readonly _isDark = signal<boolean>(this.loadFromStorage());
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._isDark()));
      this.applyTheme(this._isDark());
    });
  }

  toggleTheme(): void {
    this._isDark.set(!this._isDark());
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  }

  private loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch (e) {
      console.error('Error loading theme from localStorage', e);
      return false;
    }
  }
}
