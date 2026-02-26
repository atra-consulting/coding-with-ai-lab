import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Abteilung } from '../../../core/models/abteilung.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-abteilung-detail',
  imports: [RouterLink, LoadingSpinnerComponent],
  templateUrl: './abteilung-detail.component.html',
})
export class AbteilungDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private abteilungService = inject(AbteilungService);

  abteilung: Abteilung | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.abteilungService.getById(id).subscribe({
      next: (data) => {
        this.abteilung = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
