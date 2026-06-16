import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { CronJob, CronRun, CronRunStatus, CronTrigger } from '../../../core/models/cron.model';
import { Page } from '../../../core/models/page.model';
import { CronService } from '../../../core/services/cron.service';

@Component({
  selector: 'app-cron-dashboard',
  imports: [NgbPagination, DatePipe],
  templateUrl: './cron-dashboard.component.html',
  styleUrl: './cron-dashboard.component.scss',
})
export class CronDashboardComponent implements OnInit {
  private cronService = inject(CronService);
  private destroyRef = inject(DestroyRef);

  jobs: CronJob[] = [];
  runsPage: Page<CronRun> | null = null;
  currentPage = 1;
  pageSize = 20;
  loading = false;
  loadingRuns = false;
  triggering = false;
  errorMessage: string | null = null;
  triggerMessage: string | null = null;

  /** Per-job in-flight flags: jobName → true while PATCH is in flight */
  togglingJobs: Record<string, boolean> = {};
  /** Per-job toggle error messages */
  toggleErrors: Record<string, string | null> = {};

  ngOnInit(): void {
    this.loadJobs();
    this.loadRuns();
  }

  get solveTasksJob(): CronJob | undefined {
    return this.jobs.find((j) => j.name === 'solve-tasks');
  }

  get runNowDisabled(): boolean {
    const job = this.solveTasksJob;
    return this.triggering || (job !== undefined && job.enabled === false);
  }

  get runNowTitle(): string | null {
    const job = this.solveTasksJob;
    if (job && job.enabled === false) {
      return 'Job ist deaktiviert. Aktivieren Sie den Job, um ihn manuell auszuführen.';
    }
    return null;
  }

  loadJobs(): void {
    this.loading = true;
    this.errorMessage = null;
    this.cronService
      .getJobs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.jobs = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Fehler beim Laden der Cron-Jobs.';
          this.loading = false;
        },
      });
  }

  loadRuns(): void {
    this.loadingRuns = true;
    this.cronService
      .getRuns(this.currentPage - 1, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.runsPage = data;
          this.loadingRuns = false;
        },
        error: () => {
          this.loadingRuns = false;
        },
      });
  }

  onPageChange(p: number): void {
    this.currentPage = p;
    this.loadRuns();
  }

  runNow(): void {
    this.triggering = true;
    this.triggerMessage = null;
    this.cronService
      .triggerNow()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (run) => {
          this.triggering = false;
          this.triggerMessage = `Ausführung gestartet: ${run.status} (ID ${run.id})`;
          this.loadJobs();
          this.currentPage = 1;
          this.loadRuns();
        },
        error: () => {
          this.triggering = false;
          this.triggerMessage = 'Fehler beim Starten der Ausführung.';
        },
      });
  }

  toggleJob(job: CronJob): void {
    // Optimistically flip
    const previousEnabled = job.enabled;
    job.enabled = !previousEnabled;

    // Set in-flight flag
    this.togglingJobs[job.name] = true;
    this.toggleErrors[job.name] = null;

    this.cronService
      .setJobEnabled(job.name, job.enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          // Replace the job with the returned DTO
          const idx = this.jobs.findIndex((j) => j.name === updated.name);
          if (idx !== -1) {
            this.jobs[idx] = updated;
          }
          this.togglingJobs[job.name] = false;
        },
        error: () => {
          // Revert the optimistic flip
          job.enabled = previousEnabled;
          this.togglingJobs[job.name] = false;
          this.toggleErrors[job.name] = 'Fehler beim Ändern des Job-Status.';
        },
      });
  }

  statusBadgeClass(status: CronRunStatus): string {
    switch (status) {
      case 'RUNNING':
        return 'badge bg-primary';
      case 'SUCCESS':
        return 'badge bg-success';
      case 'FAILED':
        return 'badge bg-danger';
      case 'SKIPPED':
        return 'badge bg-secondary';
    }
  }

  triggerBadgeClass(trigger: CronTrigger): string {
    switch (trigger) {
      case 'CRON':
        return 'badge bg-light text-dark border';
      case 'MANUAL':
        return 'badge bg-info';
    }
  }

  formatDuration(ms: number | null): string {
    if (ms === null) {
      return '—';
    }
    if (ms < 1000) {
      return `${ms} ms`;
    }
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} s`;
  }
}
