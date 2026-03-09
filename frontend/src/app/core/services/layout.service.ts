import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly STORAGE_KEY = 'sidebar_collapsed';

  collapsed = signal<boolean>(this.loadFromStorage());

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.collapsed()));
    });
  }

  toggleSidebar(): void {
    this.collapsed.set(!this.collapsed());
  }

  private loadFromStorage(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  }
}
