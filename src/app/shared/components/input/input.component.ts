import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export type InputState = 'default' | 'error' | 'success';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label) {
        <label
          [for]="inputId"
          class="text-xs font-semibold text-[var(--color-neutro-700)] uppercase tracking-wide"
        >
          {{ label }}
          @if (required) {
            <span class="text-[var(--color-critico)]">*</span>
          }
        </label>
      }

      <input
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="isDisabled()"
        [class]="inputClasses"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />

      @if (helperText) {
        <span [class]="helperClasses">{{ helperText }}</span>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
  @Input() inputId = `input-${Math.random().toString(36).slice(2, 8)}`;
  @Input() state: InputState = 'default';
  @Input() helperText = '';
  @Input() required = false;

  @Input() set disabled(val: boolean) {
    this.isDisabled.set(val);
  }

  protected value = signal('');
  protected isDisabled = signal(false);
  private touched = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  protected onBlur(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }

  protected get inputClasses(): string {
    const base = 'w-full px-4 py-3 text-sm rounded-[var(--radius-sm)] border-[1.5px] bg-white text-[var(--color-neutro-900)] placeholder:text-[var(--color-neutro-500)] transition-all duration-150 outline-none';

    const states: Record<InputState, string> = {
      default: 'border-[var(--color-neutro-300)] focus:border-[var(--color-azul-primario)] focus:shadow-[0_0_0_3px_rgba(12,76,138,0.14)]',
      error: 'border-[var(--color-critico)] focus:border-[var(--color-critico)] focus:shadow-[0_0_0_3px_rgba(217,72,75,0.14)]',
      success: 'border-[var(--color-sucesso)] focus:border-[var(--color-sucesso)] focus:shadow-[0_0_0_3px_rgba(47,158,110,0.14)]',
    };

    const disabledClass = this.isDisabled()
      ? '!bg-[var(--color-desabilitado-bg)] !border-[var(--color-neutro-150)] !text-[var(--color-desabilitado)] cursor-not-allowed'
      : '';

    return [base, states[this.state], disabledClass].filter(Boolean).join(' ');
  }

  protected get helperClasses(): string {
    const stateColors: Record<InputState, string> = {
      default: 'text-[var(--color-neutro-500)]',
      error: 'text-[var(--color-critico)]',
      success: 'text-[var(--color-sucesso)]',
    };
    return `text-xs ${stateColors[this.state]}`;
  }
}
