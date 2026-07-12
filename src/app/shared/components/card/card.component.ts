import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
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
