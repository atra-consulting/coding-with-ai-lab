import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'eurCurrency', pure: false })
export class EurCurrencyPipe implements PipeTransform {
  private langService = inject(LanguageService);

  transform(value: number | null | undefined, currency = 'EUR'): string {
    if (value == null) return '-';
    return new Intl.NumberFormat(this.langService.getLocale(), {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
