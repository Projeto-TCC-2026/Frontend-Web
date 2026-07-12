import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../../core/services/dialog.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-components-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
    LoadingComponent,
    EmptyStateComponent,
    DialogComponent,
    ConfirmDialogComponent,
    DataTableComponent,
  ],
  templateUrl: './components-demo.component.html',
})
export class ComponentsDemoComponent {
  private dialogService = inject(DialogService);
  private notification = inject(NotificationService);

  protected nameControl = new FormControl('');
  protected emailControl = new FormControl('');

  protected loadingBtn = signal(false);
  protected customDialogOpen = signal(false);
  protected confirmResult = signal('');

  // Table demo data
  protected tableColumns: TableColumn[] = [
    { key: 'name', label: 'Paciente' },
    { key: 'age', label: 'Idade', format: (v) => `${v} anos` },
    { key: 'status', label: 'Status' },
    { key: 'lastVisit', label: 'Última consulta' },
  ];

  protected tableData = Array.from({ length: 27 }, (_, i) => ({
    name: `Paciente ${i + 1}`,
    age: 25 + Math.floor(Math.random() * 50),
    status: ['Estável', 'Atenção', 'Crítico'][Math.floor(Math.random() * 3)],
    lastVisit: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/06/2026`,
  }));

  protected simulateLoading(): void {
    this.loadingBtn.set(true);
    setTimeout(() => this.loadingBtn.set(false), 2000);
  }

  protected openCustomDialog(): void {
    this.customDialogOpen.set(true);
  }

  protected closeCustomDialog(): void {
    this.customDialogOpen.set(false);
  }

  protected async openConfirmDialog(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir paciente?',
      message: 'Esta ação não pode ser desfeita. O paciente será removido permanentemente do sistema.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });
    this.confirmResult.set(confirmed ? 'Confirmado ✓' : 'Cancelado ✗');
  }

  protected showSuccessToast(): void {
    this.notification.success('Paciente salvo com sucesso!');
  }

  protected showErrorToast(): void {
    this.notification.error('Erro ao salvar. Tente novamente.');
  }

  protected showWarningToast(): void {
    this.notification.warning('Alguns campos precisam de atenção.');
  }

  protected showInfoToast(): void {
    this.notification.info('Sincronização em andamento.');
  }
}
