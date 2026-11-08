import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideSearch } from '@lucide/angular';

@Component({
  selector: 'app-input-search-filter',
  standalone: true,
  imports: [CommonModule, LucideSearch],
  templateUrl: './input-search-filter.component.html',
})
export class InputSearchFilterComponent {
  @Input() value = '';
  @Input() placeholder = 'Buscar registros';
  @Input() inputId = 'search-filter-input';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextValue = input.value;
    this.valueChange.emit(nextValue);
  }
}
