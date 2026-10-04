import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideCheck,
  LucideTriangleAlert,
  LucideInfo,
} from '@lucide/angular';

import { DoctorAlertService } from '../../core/services/doctor-alert.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import {
  DoctorAlert,
  DoctorAlertConfirmationReason,
  DoctorAlertPage,
  DoctorAlertStatus,
} from '../../core/models/entities/doctor-alert.model';

import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface AlertTab {
  status: DoctorAlertStatus;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}

const PAGE_SIZE = 20;

const READING_TYPE_LABELS: Record<string, string> = {
  HEART_RATE: 'Frequência cardíaca',
  SPO2: 'Saturação de oxigênio',
  TEMPERATURE: 'Temperatura',
};

const CONFIRMATION_REASON_LABELS: Record<DoctorAlertConfirmationReason, string> = {
  DUAS_LEITURAS: 'Duas leituras seguidas fora do normal',
  PACIENTE_NAO_ESTA_BEM: 'Paciente respondeu que não está bem',
  SEM_RESPOSTA: 'Paciente não respondeu em 10 minutos',
};

/** As medições chegam em UTC; o médico lê sempre no fuso de São Paulo. */
const SAO_PAULO_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,
    ButtonComponent,
    EmptyStateComponent,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCheck,
    LucideTriangleAlert,
    LucideInfo,
  ],
  templateUrl: './alerts.component.html',
})
export class AlertsComponent implements OnInit {
  private alertService = inject(DoctorAlertService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);

  protected readonly tabs: AlertTab[] = [
    {
      status: 'PENDING',
      label: 'Pendentes',
      emptyTitle: 'Nenhum alerta pendente',
      emptyDescription: 'Não há alertas aguardando a sua avaliação neste momento.',
    },
    {
      status: 'AWAITING_PATIENT',
      label: 'Aguardando paciente',
      emptyTitle: 'Nenhum alerta aguardando o paciente',
      emptyDescription: 'Não há confirmações pendentes de resposta do paciente.',
    },
    {
      status: 'RESOLVED',
      label: 'Resolvidos',
      emptyTitle: 'Nenhum alerta resolvido',
      emptyDescription: 'Os alertas que você marcar como resolvidos aparecem aqui.',
    },
  ];

  protected activeStatus = signal<DoctorAlertStatus>('PENDING');
  protected alerts = signal<DoctorAlert[]>([]);
  protected loading = signal(true);
  protected loadError = signal<string | null>(null);
  protected resolvingId = signal<string | null>(null);

  protected pageIndex = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);

  ngOnInit(): void {
    this.loadAlerts(0);
  }

  protected selectTab(status: DoctorAlertStatus): void {
    if (this.activeStatus() === status) return;
    this.activeStatus.set(status);
    this.loadAlerts(0);
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.pageIndex()) return;
    this.loadAlerts(page);
  }

  protected reload(): void {
    this.loadAlerts(this.pageIndex());
  }

  private loadAlerts(page = this.pageIndex()): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.alertService.getAlerts(this.activeStatus(), page, PAGE_SIZE).subscribe({
      next: (response: DoctorAlertPage) => {
        this.alerts.set(response.content);
        this.pageIndex.set(response.number);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.alerts.set([]);
        this.totalPages.set(0);
        this.totalElements.set(0);
        this.loadError.set(this.extractErrorMessage(error, 'Erro ao carregar alertas.'));
        this.loading.set(false);
      },
    });
  }

  protected async resolveAlert(alert: DoctorAlert): Promise<void> {
    if (this.resolvingId()) return;

    const confirmed = await this.dialogService.confirm({
      title: 'Resolver alerta',
      message: 'Marcar este alerta como resolvido?',
      confirmLabel: 'Resolver',
      cancelLabel: 'Cancelar',
    });

    if (!confirmed) return;

    this.resolvingId.set(alert.id);

    this.alertService.resolve(alert.id).subscribe({
      next: () => {
        this.resolvingId.set(null);
        this.notify.success('Alerta marcado como resolvido.');
        this.loadAlerts(this.pageIndex());
      },
      error: (error: unknown) => {
        this.resolvingId.set(null);
        this.notify.error(this.extractErrorMessage(error, 'Erro ao resolver alerta.'));
      },
    });
  }

  protected canResolve(alert: DoctorAlert): boolean {
    return alert.status === 'PENDING';
  }

  protected isResolving(alert: DoctorAlert): boolean {
    return this.resolvingId() === alert.id;
  }

  protected getReadingTypeLabel(readingType: string): string {
    return READING_TYPE_LABELS[readingType] ?? readingType;
  }

  protected getConfirmationReasonLabel(reason: DoctorAlertConfirmationReason | null): string {
    if (!reason) return '—';
    return CONFIRMATION_REASON_LABELS[reason] ?? reason;
  }

  /** dd/MM/yyyy HH:mm no fuso America/Sao_Paulo. */
  protected formatMeasuredAt(isoUtc: string): string {
    if (!isoUtc) return '—';
    const date = new Date(isoUtc);
    if (Number.isNaN(date.getTime())) return isoUtc;
    return SAO_PAULO_FORMATTER.format(date).replace(', ', ' ');
  }

  protected get activeTab(): AlertTab {
    const status = this.activeStatus();
    return this.tabs.find(tab => tab.status === status) ?? this.tabs[0];
  }

  /** 400/422 não geram toast automático (ver error.interceptor); a tela exibe a mensagem do backend. */
  private extractErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const message = err.error?.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return fallback;
  }
}
