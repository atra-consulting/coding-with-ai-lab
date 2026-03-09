import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TopFirma } from '../../../../core/models/dashboard.model';
import { EurCurrencyPipe } from '../../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-top-companies',
  imports: [EurCurrencyPipe, RouterLink, TranslateModule],
  templateUrl: './top-companies.component.html',
})
export class TopCompaniesComponent {
  @Input({ required: true }) companies!: TopFirma[];
}
