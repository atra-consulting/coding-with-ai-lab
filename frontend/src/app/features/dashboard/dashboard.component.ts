import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Willkommen im CRM</h5>
        <p class="card-text">Nutzen Sie die Navigation links, um auf die verschiedenen Bereiche zuzugreifen.</p>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
