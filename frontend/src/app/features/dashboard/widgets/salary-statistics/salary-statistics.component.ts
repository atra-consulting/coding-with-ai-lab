import { Component, Input, OnChanges } from '@angular/core';
import { DepartmentSalary } from '../../../../core/models/dashboard.model';
import { EurCurrencyPipe } from '../../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-salary-statistics',
  imports: [EurCurrencyPipe],
  templateUrl: './salary-statistics.component.html',
})
export class SalaryStatisticsComponent implements OnChanges {
  @Input({ required: true }) departments!: DepartmentSalary[];
  maxSalary = 0;

  ngOnChanges(): void {
    this.maxSalary = Math.max(...this.departments.map((d) => d.averageSalary), 1);
  }

  getWidth(salary: number): number {
    return (salary / this.maxSalary) * 100;
  }
}
