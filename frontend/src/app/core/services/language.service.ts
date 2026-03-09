import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'crm-language';
const DEFAULT_LANG = 'de';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  currentLang = signal<string>(DEFAULT_LANG);

  constructor() {
    this.translate.addLangs(['de', 'en']);
    this.translate.setDefaultLang(DEFAULT_LANG);

    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    this.setLanguage(saved);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }

  getLocale(): string {
    return this.currentLang() === 'de' ? 'de-DE' : 'en-US';
  }

  getDateFormat(): string {
    return this.currentLang() === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
  }

  getDateTimeFormat(): string {
    return this.currentLang() === 'de' ? 'dd.MM.yyyy HH:mm' : 'MM/dd/yyyy h:mm a';
  }
}
