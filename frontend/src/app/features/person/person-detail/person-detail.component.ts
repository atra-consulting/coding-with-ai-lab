import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Person } from '../../../core/models/person.model';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe],
  templateUrl: './person-detail.component.html',
})
export class PersonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private personService = inject(PersonService);

  person: Person | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.personService.getById(id).subscribe({
      next: (data) => {
        this.person = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
