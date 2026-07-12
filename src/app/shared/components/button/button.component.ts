import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideLoaderCircle } from '@lucide/angular';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, LucideLoaderCircle],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="computedClasses"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <svg lucideLoaderCircle class="w-4 h-4 animate-spin" aria-hidden="true"></svg>
        <span>{{ loadingText }}</span>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingText = 'Processando...';
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

  protected get computedClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-[var(--color-azul-primario)] text-white hover:bg-[var(--color-azul-marinho)] focus:ring-[var(--color-azul-primario)]/40',
      secondary: 'bg-white text-[var(--color-azul-primario)] border border-[var(--color-azul-primario)] hover:bg-[var(--color-azul-primario)]/5 focus:ring-[var(--color-azul-primario)]/30',
      ghost: 'bg-transparent text-[var(--color-azul-primario)] hover:bg-[var(--color-neutro-100)] focus:ring-[var(--color-azul-primario)]/20',
      destructive: 'bg-[var(--color-critico)] text-white hover:bg-[#c13e40] focus:ring-[var(--color-critico)]/40',
      success: 'bg-[var(--color-sucesso)] text-white hover:bg-[#278a5e] focus:ring-[var(--color-sucesso)]/40',
    };

    const disabledClass = (this.disabled || this.loading)
      ? 'opacity-50 pointer-events-none cursor-default'
      : '';

    const widthClass = this.fullWidth ? 'w-full' : '';

    return [base, sizes[this.size], variants[this.variant], disabledClass, widthClass]
      .filter(Boolean)
      .join(' ');
  }
}
