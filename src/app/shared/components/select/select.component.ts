import { Component, ElementRef, HostListener, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { LucideChevronDown, LucideCheck } from '@lucide/angular';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideChevronDown, LucideCheck],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
  templateUrl: './select.component.html',
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() inputId = `select-${Math.random().toString(36).slice(2, 8)}`;
  @Input() placeholder = 'Selecione uma opção';
  @Input() set selectedValue(value: string) { this.value.set(value ?? ''); }
  @Input() options: SelectOption[] = [];
  @Input() required = false;
  @Input() disabled = false;
  @Input() state: 'default' | 'error' = 'default';
  @Input() helperText = '';
  @Output() changed = new EventEmitter<string>();

  protected value = signal('');
  protected open = signal(false);
  protected activeIndex = signal(-1);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  writeValue(value: string | null): void { this.value.set(value ?? ''); }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  protected get selectedOption(): SelectOption | undefined {
    return this.options.find(option => option.value === this.value());
  }

  protected toggle(): void {
    if (this.disabled) return;
    this.open.update(value => !value);
    if (this.open()) this.activeIndex.set(Math.max(0, this.options.findIndex(option => option.value === this.value())));
  }

  protected choose(option: SelectOption): void {
    if (option.disabled || this.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.changed.emit(option.value);
    this.onTouched();
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.toggle(); return; }
    if (event.key === 'Escape') { this.open.set(false); return; }
    if (!this.open()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.update(index => (index + direction + this.options.length) % this.options.length);
    }
    if (event.key === 'Enter' && this.activeIndex() >= 0) {
      event.preventDefault();
      this.choose(this.options[this.activeIndex()]);
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
