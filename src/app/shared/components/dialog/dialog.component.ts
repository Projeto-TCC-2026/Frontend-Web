import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, ConfigurableFocusTrap, ConfigurableFocusTrapFactory } from '@angular/cdk/a11y';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, LucideX],
  templateUrl: './dialog.component.html',
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() closable = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialogPanel') dialogPanel?: ElementRef<HTMLElement>;

  private focusTrap?: ConfigurableFocusTrap;
  protected titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`;

  constructor(private focusTrapFactory: ConfigurableFocusTrapFactory) {}

  ngAfterViewInit(): void {
    this.setupFocusTrap();
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();
  }

  close(): void {
    this.open = false;
    this.closed.emit();
  }

  protected onBackdropClick(): void {
    if (this.closable) {
      this.close();
    }
  }

  protected onEscapeKey(): void {
    if (this.closable) {
      this.close();
    }
  }

  protected get panelClasses(): string {
    const base = 'bg-white rounded-[var(--radius-lg)] shadow-lg w-full transition-all duration-150';

    const sizes = {
      sm: 'max-w-sm p-5',
      md: 'max-w-lg p-6',
      lg: 'max-w-2xl p-8',
    };

    return `${base} ${sizes[this.size]}`;
  }

  private setupFocusTrap(): void {
    // Re-check whenever open changes via ngDoCheck would be complex;
    // we use a simpler MutationObserver-free approach: the parent controls open state.
    setTimeout(() => {
      if (this.dialogPanel?.nativeElement && this.open) {
        this.focusTrap?.destroy();
        this.focusTrap = this.focusTrapFactory.create(this.dialogPanel.nativeElement);
        this.focusTrap.focusInitialElementWhenReady();
      }
    });
  }
}
