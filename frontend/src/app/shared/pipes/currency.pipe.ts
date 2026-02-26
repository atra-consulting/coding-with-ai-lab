import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'eurCurrency' })
export class EurCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'EUR'): string {
    if (value == null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
