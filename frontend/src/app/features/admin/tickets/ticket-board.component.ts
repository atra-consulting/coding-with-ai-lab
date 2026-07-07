import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faClipboardList,
  faComment,
  faFileLines,
  faPlus,
  faSpinner,
  faCircleCheck,
  faClock,
  faRobot,
  faUser,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import { Ticket, TicketStatus, TicketSummary } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TicketCreateComponent } from './ticket-create.component';

@Component({
  selector: 'app-ticket-board',
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    FaIconComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page-header">
      <h2>Ticket-Board</h2>
      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary"
          (click)="toggleRecent()"
          [attr.aria-pressed]="recentOnly"
          title="Letzte 60 Minuten"
        >
          {{ recentOnly ? 'Alle' : 'Kürzlich geändert' }}
        </button>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <fa-icon [icon]="faPlus" class="me-2" />Neues Ticket
        </button>
      </div>
    </div>

    @if (loading) {
      <app-loading-spinner />
    } @else if (errorMessage) {
      <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
    } @else {
      <!-- KPI Summary Cards -->
      @if (summary) {
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-4 col-xl">
            <div class="card h-100 kpi-tile kpi-definition">
              <div class="card-body d-flex align-items-center gap-3">
                <span class="kpi-icon"><fa-icon [icon]="faFileLines" /></span>
                <div>
                  <div class="kpi-value">{{ summary.byStatus.DEFINITION }}</div>
                  <div class="kpi-label">Definition</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl">
            <div class="card h-100 kpi-tile kpi-todo">
              <div class="card-body d-flex align-items-center gap-3">
                <span class="kpi-icon"><fa-icon [icon]="faClipboardList" /></span>
                <div>
                  <div class="kpi-value">{{ summary.byStatus.TODO }}</div>
                  <div class="kpi-label">Zu bereit</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl">
            <div class="card h-100 kpi-tile kpi-inprogress">
              <div class="card-body d-flex align-items-center gap-3">
                <span class="kpi-icon"><fa-icon [icon]="faSpinner" /></span>
                <div>
                  <div class="kpi-value">{{ summary.byStatus.IN_PROGRESS }}</div>
                  <div class="kpi-label">In Arbeit</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl">
            <div class="card h-100 kpi-tile kpi-onhold">
              <div class="card-body d-flex align-items-center gap-3">
                <span class="kpi-icon"><fa-icon [icon]="faClock" /></span>
                <div>
                  <div class="kpi-value">{{ summary.byStatus.ON_HOLD }}</div>
                  <div class="kpi-label">Wartet</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl">
            <div class="card h-100 kpi-tile kpi-done">
              <div class="card-body d-flex align-items-center gap-3">
                <span class="kpi-icon"><fa-icon [icon]="faCircleCheck" /></span>
                <div>
                  <div class="kpi-value">{{ summary.byStatus.DONE }}</div>
                  <div class="kpi-label">Erledigt</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Owner / Type / Solution row -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted text-uppercase small">Eigentümer</h6>
                <div class="d-flex gap-3">
                  <div class="text-center">
                    <div class="fs-4 fw-bold text-primary">{{ summary.byOwner.AI }}</div>
                    <div class="small text-muted">KI</div>
                  </div>
                  <div class="text-center">
                    <div class="fs-4 fw-bold" style="color: #6c757d">{{ summary.byOwner.HUMAN }}</div>
                    <div class="small text-muted">Mensch</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted text-uppercase small">Typ</h6>
                <div class="d-flex gap-3">
                  <div class="text-center">
                    <div class="fs-4 fw-bold" style="color: #264892">{{ summary.byType.FEATURE }}</div>
                    <div class="small text-muted">Feature</div>
                  </div>
                  <div class="text-center">
                    <div class="fs-4 fw-bold" style="color: #dc421e">{{ summary.byType.BUG }}</div>
                    <div class="small text-muted">Bug</div>
                  </div>
                  <div class="text-center">
                    <div class="fs-4 fw-bold" style="color: #d98a0b">{{ summary.byType.CHORE }}</div>
                    <div class="small text-muted">Aufgabe</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted text-uppercase small">Lösung</h6>
                <div class="d-flex gap-3">
                  <div class="text-center">
                    <div class="fs-4 fw-bold" style="color: #198754">{{ summary.bySolution.DONE }}</div>
                    <div class="small text-muted">Erledigt</div>
                  </div>
                  <div class="text-center">
                    <div class="fs-4 fw-bold" style="color: #6c757d">{{ summary.bySolution.WONT_DO }}</div>
                    <div class="small text-muted">Wird nicht gemacht</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      @if (dropError) {
        <div class="alert alert-danger alert-dismissible mb-3" role="alert">
          {{ dropError }}
          <button type="button" class="btn-close" (click)="dropError = null" aria-label="Schließen"></button>
        </div>
      }

      @if (recentOnly) {
        <div class="alert alert-info py-2 px-3 mb-3 small" role="status">
          Gefiltert: nur Tickets der letzten 60 Minuten. Die Kennzahlen oben zeigen weiterhin alle Tickets.
        </div>
      }

      <!-- Kanban Board -->
      <div class="board-container" cdkDropListGroup>
        <!-- Definition -->
        <div class="board-column">
          <div class="column-header column-definition">
            <span class="column-title">Definition</span>
            <span class="badge bg-secondary">{{ viewDefinition.length }}</span>
          </div>
          <div
            class="column-body"
            cdkDropList
            id="list-DEFINITION"
            [cdkDropListData]="viewDefinition"
            [cdkDropListConnectedTo]="['list-TODO', 'list-IN_PROGRESS', 'list-ON_HOLD', 'list-DONE']"
            (cdkDropListDropped)="onDrop($event, 'DEFINITION')"
          >
            @for (ticket of viewDefinition; track ticket.id) {
              <div class="ticket-card" cdkDrag [cdkDragData]="ticket" [cdkDragDisabled]="recentOnly">
                <div class="ticket-drag-handle" cdkDragHandle (click)="$event.stopPropagation()">
                  <fa-icon [icon]="faGripVertical" />
                </div>
                <div class="ticket-body-click" role="button" tabindex="0" (click)="navigateToDetail(ticket.id)" (keydown.enter)="navigateToDetail(ticket.id)" (keydown.space)="$event.preventDefault(); navigateToDetail(ticket.id)">
                  <div class="ticket-title">{{ ticket.title }}</div>
                  <div class="ticket-badges mt-2">
                    <span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span>
                    <span [class]="ownerBadgeClass(ticket.owner)" class="ms-1">
                      <fa-icon [icon]="ticket.owner === 'AI' ? faRobot : faUser" class="me-1" />{{ ownerLabel(ticket.owner) }}
                    </span>
                  </div>
                  @if ((ticket.commentCount ?? 0) > 0) {
                    <div class="ticket-comment-count mt-1">
                      <fa-icon [icon]="faComment" class="me-1 text-muted" />
                      <span class="small text-muted">{{ ticket.commentCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
            @if (viewDefinition.length === 0) {
              <div class="column-empty">{{ recentOnly ? 'Keine kürzlich geänderten Tickets' : 'Keine Tickets' }}</div>
            }
          </div>
        </div>

        <!-- To Do -->
        <div class="board-column">
          <div class="column-header column-todo">
            <span class="column-title">Zu bereit</span>
            <span class="badge bg-secondary">{{ viewTodo.length }}</span>
          </div>
          <div
            class="column-body"
            cdkDropList
            id="list-TODO"
            [cdkDropListData]="viewTodo"
            [cdkDropListConnectedTo]="['list-DEFINITION', 'list-IN_PROGRESS', 'list-ON_HOLD', 'list-DONE']"
            (cdkDropListDropped)="onDrop($event, 'TODO')"
          >
            @for (ticket of viewTodo; track ticket.id) {
              <div class="ticket-card" cdkDrag [cdkDragData]="ticket" [cdkDragDisabled]="recentOnly">
                <div class="ticket-drag-handle" cdkDragHandle (click)="$event.stopPropagation()">
                  <fa-icon [icon]="faGripVertical" />
                </div>
                <div class="ticket-body-click" role="button" tabindex="0" (click)="navigateToDetail(ticket.id)" (keydown.enter)="navigateToDetail(ticket.id)" (keydown.space)="$event.preventDefault(); navigateToDetail(ticket.id)">
                  <div class="ticket-title">{{ ticket.title }}</div>
                  <div class="ticket-badges mt-2">
                    <span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span>
                    <span [class]="ownerBadgeClass(ticket.owner)" class="ms-1">
                      <fa-icon [icon]="ticket.owner === 'AI' ? faRobot : faUser" class="me-1" />{{ ownerLabel(ticket.owner) }}
                    </span>
                  </div>
                  @if ((ticket.commentCount ?? 0) > 0) {
                    <div class="ticket-comment-count mt-1">
                      <fa-icon [icon]="faComment" class="me-1 text-muted" />
                      <span class="small text-muted">{{ ticket.commentCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
            @if (viewTodo.length === 0) {
              <div class="column-empty">{{ recentOnly ? 'Keine kürzlich geänderten Tickets' : 'Keine Tickets' }}</div>
            }
          </div>
        </div>

        <!-- In Progress -->
        <div class="board-column">
          <div class="column-header column-inprogress">
            <span class="column-title">In Arbeit</span>
            <span class="badge bg-secondary">{{ viewInProgress.length }}</span>
          </div>
          <div
            class="column-body"
            cdkDropList
            id="list-IN_PROGRESS"
            [cdkDropListData]="viewInProgress"
            [cdkDropListConnectedTo]="['list-DEFINITION', 'list-TODO', 'list-ON_HOLD', 'list-DONE']"
            (cdkDropListDropped)="onDrop($event, 'IN_PROGRESS')"
          >
            @for (ticket of viewInProgress; track ticket.id) {
              <div class="ticket-card" cdkDrag [cdkDragData]="ticket" [cdkDragDisabled]="recentOnly">
                <div class="ticket-drag-handle" cdkDragHandle (click)="$event.stopPropagation()">
                  <fa-icon [icon]="faGripVertical" />
                </div>
                <div class="ticket-body-click" role="button" tabindex="0" (click)="navigateToDetail(ticket.id)" (keydown.enter)="navigateToDetail(ticket.id)" (keydown.space)="$event.preventDefault(); navigateToDetail(ticket.id)">
                  <div class="ticket-title">{{ ticket.title }}</div>
                  <div class="ticket-badges mt-2">
                    <span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span>
                    <span [class]="ownerBadgeClass(ticket.owner)" class="ms-1">
                      <fa-icon [icon]="ticket.owner === 'AI' ? faRobot : faUser" class="me-1" />{{ ownerLabel(ticket.owner) }}
                    </span>
                  </div>
                  @if ((ticket.commentCount ?? 0) > 0) {
                    <div class="ticket-comment-count mt-1">
                      <fa-icon [icon]="faComment" class="me-1 text-muted" />
                      <span class="small text-muted">{{ ticket.commentCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
            @if (viewInProgress.length === 0) {
              <div class="column-empty">{{ recentOnly ? 'Keine kürzlich geänderten Tickets' : 'Keine Tickets' }}</div>
            }
          </div>
        </div>

        <!-- On Hold -->
        <div class="board-column">
          <div class="column-header column-onhold">
            <span class="column-title">Wartet</span>
            <span class="badge bg-secondary">{{ viewOnHold.length }}</span>
          </div>
          <div
            class="column-body"
            cdkDropList
            id="list-ON_HOLD"
            [cdkDropListData]="viewOnHold"
            [cdkDropListConnectedTo]="['list-DEFINITION', 'list-TODO', 'list-IN_PROGRESS', 'list-DONE']"
            (cdkDropListDropped)="onDrop($event, 'ON_HOLD')"
          >
            @for (ticket of viewOnHold; track ticket.id) {
              <div class="ticket-card" cdkDrag [cdkDragData]="ticket" [cdkDragDisabled]="recentOnly">
                <div class="ticket-drag-handle" cdkDragHandle (click)="$event.stopPropagation()">
                  <fa-icon [icon]="faGripVertical" />
                </div>
                <div class="ticket-body-click" role="button" tabindex="0" (click)="navigateToDetail(ticket.id)" (keydown.enter)="navigateToDetail(ticket.id)" (keydown.space)="$event.preventDefault(); navigateToDetail(ticket.id)">
                  <div class="ticket-title">{{ ticket.title }}</div>
                  <div class="ticket-badges mt-2">
                    <span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span>
                    <span [class]="ownerBadgeClass(ticket.owner)" class="ms-1">
                      <fa-icon [icon]="ticket.owner === 'AI' ? faRobot : faUser" class="me-1" />{{ ownerLabel(ticket.owner) }}
                    </span>
                  </div>
                  @if ((ticket.commentCount ?? 0) > 0) {
                    <div class="ticket-comment-count mt-1">
                      <fa-icon [icon]="faComment" class="me-1 text-muted" />
                      <span class="small text-muted">{{ ticket.commentCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
            @if (viewOnHold.length === 0) {
              <div class="column-empty">{{ recentOnly ? 'Keine kürzlich geänderten Tickets' : 'Keine Tickets' }}</div>
            }
          </div>
        </div>

        <!-- Done -->
        <div class="board-column">
          <div class="column-header column-done">
            <span class="column-title">Erledigt</span>
            <span class="badge bg-secondary">{{ viewDone.length }}</span>
          </div>
          <div
            class="column-body"
            cdkDropList
            id="list-DONE"
            [cdkDropListData]="viewDone"
            [cdkDropListConnectedTo]="['list-DEFINITION', 'list-TODO', 'list-IN_PROGRESS', 'list-ON_HOLD']"
            (cdkDropListDropped)="onDrop($event, 'DONE')"
          >
            @for (ticket of viewDone; track ticket.id) {
              <div class="ticket-card" cdkDrag [cdkDragData]="ticket" [cdkDragDisabled]="recentOnly">
                <div class="ticket-drag-handle" cdkDragHandle (click)="$event.stopPropagation()">
                  <fa-icon [icon]="faGripVertical" />
                </div>
                <div class="ticket-body-click" role="button" tabindex="0" (click)="navigateToDetail(ticket.id)" (keydown.enter)="navigateToDetail(ticket.id)" (keydown.space)="$event.preventDefault(); navigateToDetail(ticket.id)">
                  <div class="ticket-title">{{ ticket.title }}</div>
                  <div class="ticket-badges mt-2">
                    <span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span>
                    <span [class]="ownerBadgeClass(ticket.owner)" class="ms-1">
                      <fa-icon [icon]="ticket.owner === 'AI' ? faRobot : faUser" class="me-1" />{{ ownerLabel(ticket.owner) }}
                    </span>
                    @if (ticket.solution) {
                      <span [class]="solutionBadgeClass(ticket.solution)" class="ms-1">
                        {{ solutionLabel(ticket.solution) }}
                      </span>
                    }
                  </div>
                  @if ((ticket.commentCount ?? 0) > 0) {
                    <div class="ticket-comment-count mt-1">
                      <fa-icon [icon]="faComment" class="me-1 text-muted" />
                      <span class="small text-muted">{{ ticket.commentCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
            @if (viewDone.length === 0) {
              <div class="column-empty">{{ recentOnly ? 'Keine kürzlich geänderten Tickets' : 'Keine Tickets' }}</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* KPI tiles */
      .kpi-tile {
        border-left: 4px solid transparent;
      }
      .kpi-icon {
        flex: 0 0 auto;
        width: 3rem;
        height: 3rem;
        border-radius: 0.85rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }
      .kpi-value {
        font-size: 1.9rem;
        font-weight: 700;
        line-height: 1;
      }
      .kpi-label {
        color: #6c757d;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 0.3rem;
      }

      .kpi-definition {
        border-left-color: #0dcaf0;
      }
      .kpi-definition .kpi-icon {
        background: rgba(13, 202, 240, 0.14);
        color: #076e85;
      }
      .kpi-todo {
        border-left-color: #264892;
      }
      .kpi-todo .kpi-icon {
        background: rgba(38, 72, 146, 0.12);
        color: #264892;
      }
      .kpi-inprogress {
        border-left-color: #d98a0b;
      }
      .kpi-inprogress .kpi-icon {
        background: rgba(217, 138, 11, 0.14);
        color: #b9770b;
      }
      .kpi-onhold {
        border-left-color: #6c757d;
      }
      .kpi-onhold .kpi-icon {
        background: rgba(108, 117, 125, 0.12);
        color: #6c757d;
      }
      .kpi-done {
        border-left-color: #198754;
      }
      .kpi-done .kpi-icon {
        background: rgba(25, 135, 84, 0.12);
        color: #198754;
      }

      /* Board layout */
      .board-container {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        align-items: start;
      }

      @media (max-width: 1400px) {
        .board-container {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 1024px) {
        .board-container {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .board-container {
          grid-template-columns: 1fr;
        }
      }

      .board-column {
        background: #f8f9fa;
        border-radius: 0.5rem;
        overflow: hidden;
        min-height: 200px;
      }

      .column-header {
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid transparent;
      }

      .column-title {
        font-weight: 700;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .column-definition {
        background: rgba(13, 202, 240, 0.1);
        border-bottom-color: #0dcaf0;
        color: #076e85;
      }
      .column-todo {
        background: rgba(38, 72, 146, 0.08);
        border-bottom-color: #264892;
        color: #264892;
      }
      .column-inprogress {
        background: rgba(217, 138, 11, 0.1);
        border-bottom-color: #d98a0b;
        color: #b9770b;
      }
      .column-onhold {
        background: rgba(108, 117, 125, 0.1);
        border-bottom-color: #6c757d;
        color: #495057;
      }
      .column-done {
        background: rgba(25, 135, 84, 0.08);
        border-bottom-color: #198754;
        color: #198754;
      }

      .column-body {
        padding: 0.5rem;
        min-height: 150px;
      }

      .column-body.cdk-drop-list-receiving {
        background: rgba(38, 72, 146, 0.08);
        border: 2px dashed #264892;
      }

      .column-empty {
        text-align: center;
        color: #adb5bd;
        font-size: 0.85rem;
        padding: 2rem 0.5rem;
        font-style: italic;
      }

      /* Ticket cards */
      .ticket-card {
        background: #fff;
        border-radius: 0.4rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        border: 1px solid #e9ecef;
        transition: box-shadow 0.15s ease;
        display: flex;
        align-items: flex-start;
        gap: 0;
        overflow: hidden;
      }

      .ticket-drag-handle {
        flex: 0 0 auto;
        padding: 0.75rem 0.5rem;
        color: #adb5bd;
        cursor: grab;
        display: flex;
        align-items: flex-start;
        padding-top: 0.85rem;
        touch-action: none;
      }

      .ticket-drag-handle:active {
        cursor: grabbing;
      }

      .cdk-drag-disabled .ticket-drag-handle {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .ticket-body-click {
        flex: 1 1 auto;
        padding: 0.75rem 0.75rem 0.75rem 0.25rem;
        cursor: pointer;
        min-width: 0;
      }

      .ticket-card:hover {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
        border-color: #ced4da;
      }

      .ticket-card.cdk-drag-preview {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        border-color: #264892;
        opacity: 0.95;
      }

      .ticket-card.cdk-drag-placeholder {
        opacity: 0.3;
        background: #e9ecef;
        box-shadow: none;
      }

      .ticket-card.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .cdk-drop-list-dragging .ticket-card:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .ticket-title {
        font-size: 0.88rem;
        font-weight: 600;
        color: #212529;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ticket-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        align-items: center;
      }

      .ticket-comment-count {
        display: flex;
        align-items: center;
      }

      /* Type badges */
      .type-feature {
        background-color: #264892;
        color: #fff;
      }
      .type-bug {
        background-color: #dc421e;
        color: #fff;
      }
      .type-chore {
        background-color: #d98a0b;
        color: #fff;
      }

      /* Owner badges */
      .owner-ai {
        background-color: #6f42c1;
        color: #fff;
      }
      .owner-human {
        background-color: #6c757d;
        color: #fff;
      }

      /* Solution badges */
      .solution-done {
        background-color: #198754;
        color: #fff;
      }
      .solution-wontdo {
        background-color: #adb5bd;
        color: #212529;
      }
    `,
  ],
})
export class TicketBoardComponent implements OnInit {
  private ticketService = inject(TicketService);
  private notification = inject(NotificationService);
  private modalService = inject(NgbModal);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private summaryTrigger$ = new Subject<void>();

  definition: Ticket[] = [];
  todo: Ticket[] = [];
  inProgress: Ticket[] = [];
  onHold: Ticket[] = [];
  done: Ticket[] = [];
  summary: TicketSummary | null = null;
  loading = true;
  errorMessage: string | null = null;
  dropError: string | null = null;

  recentOnly = false;
  private readonly RECENT_WINDOW_MS = 60 * 60 * 1000;

  viewDefinition: Ticket[] = [];
  viewTodo: Ticket[] = [];
  viewInProgress: Ticket[] = [];
  viewOnHold: Ticket[] = [];
  viewDone: Ticket[] = [];

  readonly faPlus = faPlus;
  readonly faClipboardList = faClipboardList;
  readonly faFileLines = faFileLines;
  readonly faSpinner = faSpinner;
  readonly faClock = faClock;
  readonly faCircleCheck = faCircleCheck;
  readonly faComment = faComment;
  readonly faRobot = faRobot;
  readonly faUser = faUser;
  readonly faGripVertical = faGripVertical;

  ngOnInit(): void {
    // Wire summary refreshes through switchMap so rapid drops cancel prior calls
    this.summaryTrigger$
      .pipe(
        switchMap(() => this.ticketService.getSummary()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (s) => (this.summary = s),
        error: () => console.warn('Ticket-Zusammenfassung konnte nicht geladen werden.'),
      });

    this.loadBoard();
  }

  loadBoard(): void {
    this.loading = true;
    this.errorMessage = null;

    this.ticketService
      .getBoard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.definition = board.DEFINITION;
          this.todo = board.TODO;
          this.inProgress = board.IN_PROGRESS;
          this.onHold = board.ON_HOLD;
          this.done = board.DONE;
          this.loading = false;
          this.summaryTrigger$.next();
          this.refreshView();
        },
        error: () => {
          this.errorMessage = 'Fehler beim Laden des Boards.';
          this.loading = false;
        },
      });
  }

  isRecent(ticket: Ticket): boolean {
    const now = Date.now();
    return (
      now - Date.parse(ticket.updatedAt) <= this.RECENT_WINDOW_MS ||
      now - Date.parse(ticket.createdAt) <= this.RECENT_WINDOW_MS
    );
  }

  private refreshView(): void {
    this.viewDefinition = this.recentOnly
      ? this.definition.filter((t) => this.isRecent(t))
      : this.definition;
    this.viewTodo = this.recentOnly ? this.todo.filter((t) => this.isRecent(t)) : this.todo;
    this.viewInProgress = this.recentOnly
      ? this.inProgress.filter((t) => this.isRecent(t))
      : this.inProgress;
    this.viewOnHold = this.recentOnly ? this.onHold.filter((t) => this.isRecent(t)) : this.onHold;
    this.viewDone = this.recentOnly ? this.done.filter((t) => this.isRecent(t)) : this.done;
  }

  toggleRecent(): void {
    this.recentOnly = !this.recentOnly;
    this.refreshView();
  }

  onDrop(event: CdkDragDrop<Ticket[]>, targetStatus: TicketStatus): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const ticket: Ticket = event.item.data;
    const originalStatus = ticket.status;
    const originalSolution = ticket.solution;
    const sourceArray = event.previousContainer.data;
    const targetArray = event.container.data;

    // Optimistic update
    transferArrayItem(sourceArray, targetArray, event.previousIndex, event.currentIndex);
    const movedTicket = targetArray[event.currentIndex];
    if (targetStatus === 'DONE') {
      movedTicket.solution = 'DONE';
    } else {
      movedTicket.solution = null;
    }
    movedTicket.status = targetStatus;
    this.refreshView();

    this.ticketService
      .setStatus(ticket.id, targetStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.summaryTrigger$.next();
        },
        error: () => {
          // Rollback: move card back and restore original state
          transferArrayItem(targetArray, sourceArray, event.currentIndex, event.previousIndex);
          const rolledBack = sourceArray[event.previousIndex];
          rolledBack.status = originalStatus;
          rolledBack.solution = originalSolution;
          this.dropError = 'Fehler beim Verschieben des Tickets. Bitte versuche es erneut.';
          this.notification.error('Ticket konnte nicht verschoben werden.');
          this.refreshView();
        },
      });
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(TicketCreateComponent, { size: 'lg' });
    modalRef.result.then(
      () => {
        this.loadBoard();
      },
      () => {},
    );
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/admin/tickets', id]);
  }

  typeBadgeClass(type: string): string {
    switch (type) {
      case 'FEATURE':
        return 'badge type-feature';
      case 'BUG':
        return 'badge type-bug';
      case 'CHORE':
        return 'badge type-chore';
      default:
        return 'badge bg-secondary';
    }
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'FEATURE':
        return 'Feature';
      case 'BUG':
        return 'Bug';
      case 'CHORE':
        return 'Aufgabe';
      default:
        return type;
    }
  }

  ownerBadgeClass(owner: string): string {
    return owner === 'AI' ? 'badge owner-ai' : 'badge owner-human';
  }

  ownerLabel(owner: string): string {
    return owner === 'AI' ? 'KI' : 'Mensch';
  }

  solutionBadgeClass(solution: string): string {
    return solution === 'DONE' ? 'badge solution-done' : 'badge solution-wontdo';
  }

  solutionLabel(solution: string): string {
    return solution === 'DONE' ? 'Erledigt' : 'Wird nicht gemacht';
  }
}
