import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BenutzerService } from '../../../core/services/benutzer.service';
import { Benutzer } from '../../../core/models/benutzer.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-benutzer-detail',
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent],
  templateUrl: './benutzer-detail.component.html',
})
export class BenutzerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private benutzerService = inject(BenutzerService);

  benutzer: Benutzer | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.benutzerService.getById(id).subscribe({
      next: (data) => {
        this.benutzer = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
