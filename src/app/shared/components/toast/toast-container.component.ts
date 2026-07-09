import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideTriangleAlert,
  LucideInfo,
} from '@lucide/angular';
import { NotificationService, ToastType } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideCircleCheck,
    LucideCircleX,
    LucideTriangleAlert,
    LucideInfo,
  ],
  templateUrl: './toast-container.component.html'
})
export class ToastContainerComponent {

  protected readonly notifications = inject(NotificationService);

  protected bgClass(type: ToastType): string {
    switch (type) {
      case 'success': return 'bg-emerald-600';
      case 'error': return 'bg-brand-danger';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-brand-primary';
    }
  }
}
