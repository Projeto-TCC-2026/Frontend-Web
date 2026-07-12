import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="computedClasses">
      @if (title || subtitle) {
        <div class="mb-4">
          @if (title) {
            <h3 class="font-heading font-bold text-base text-[var(--color-neutro-900)]">{{ title }}</h3>
          }
          @if (subtitle) {
            <p class="text-xs text-[var(--color-neutro-500)] mt-0.5">{{ subtitle }}</p>
          }
        </div>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() bordered = true;

  protected get computedClasses(): string {
    const base = 'bg-white rounded-[var(--radius-lg)]';

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const border = this.bordered ? 'border border-[var(--color-neutro-150)]' : '';

    return [base, paddings[this.padding], border].filter(Boolean).join(' ');
  }
}
