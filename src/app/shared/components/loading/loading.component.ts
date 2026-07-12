import { Component, Input } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [LucideLoaderCircle],
  template: `
    <div [class]="containerClasses" role="status" aria-label="Carregando">
      <svg lucideLoaderCircle [class]="spinnerClasses" aria-hidden="true"></svg>
      @if (text) {
        <span class="text-sm text-[var(--color-neutro-500)]">{{ text }}</span>
      }
    </div>
  `,
})
export class LoadingComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text = '';
  @Input() fullPage = false;

  protected get containerClasses(): string {
    const base = 'flex flex-col items-center justify-center gap-3';
    const full = this.fullPage ? 'min-h-[50vh]' : '';
    return [base, full].filter(Boolean).join(' ');
  }

  protected get spinnerClasses(): string {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return `${sizes[this.size]} animate-spin text-[var(--color-azul-primario)]`;
  }
}
