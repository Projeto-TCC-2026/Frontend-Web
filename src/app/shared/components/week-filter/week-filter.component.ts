import { Component, computed, ElementRef, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

interface CalendarWeek {
  value: string;
  days: Date[];
}

@Component({
  selector: 'app-week-filter',
  standalone: true,
  imports: [CommonModule, LucideChevronDown, LucideChevronLeft, LucideChevronRight],
  templateUrl: './week-filter.component.html',
})
export class WeekFilterComponent {
  @Input() label = 'Semana';
  @Input() inputId = 'week-filter-input';
  @Input() disabled = false;

  @Input() set value(value: string) {
    this.weekValue.set(value ?? '');
  }

  @Output() valueChange = new EventEmitter<string>();

  protected readonly weekValue = signal('');
  protected readonly open = signal(false);
  protected readonly displayedMonth = signal(startOfMonth(new Date()));
  protected readonly weeks = computed(() => buildCalendarWeeks(this.displayedMonth()));
  protected readonly monthLabel = computed(() => new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(this.displayedMonth()));
  protected readonly selectedRangeLabel = computed(() => {
    const bounds = weekBounds(this.weekValue());
    if (!bounds) return 'Selecione uma semana';
    const start = formatDate(bounds.start);
    const end = formatDate(bounds.end);
    return `Semana ${this.weekNumber(this.weekValue())} · ${start} a ${end}`;
  });

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  protected toggle(): void {
    if (this.disabled) return;
    if (!this.open()) {
      const bounds = weekBounds(this.weekValue());
      this.displayedMonth.set(startOfMonth(bounds ? parseDate(bounds.start) : new Date()));
    }
    this.open.update(isOpen => !isOpen);
  }

  protected changeMonth(offset: number): void {
    const month = new Date(this.displayedMonth());
    month.setMonth(month.getMonth() + offset, 1);
    this.displayedMonth.set(month);
  }

  protected selectWeek(week: CalendarWeek): void {
    this.weekValue.set(week.value);
    this.valueChange.emit(week.value);
    this.open.set(false);
  }

  protected isSelectedWeek(week: CalendarWeek): boolean {
    return week.value === this.weekValue();
  }

  protected isOutsideMonth(day: Date): boolean {
    const month = this.displayedMonth();
    return day.getMonth() !== month.getMonth() || day.getFullYear() !== month.getFullYear();
  }

  protected dayNumber(day: Date): number {
    return day.getDate();
  }

  protected weekNumber(value: string): string {
    return value.slice(-2);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }
}

function buildCalendarWeeks(month: Date): CalendarWeek[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstMonday = new Date(firstOfMonth);
  firstMonday.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));

  return Array.from({ length: 6 }, (_, weekIndex) => {
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + weekIndex * 7);
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + dayIndex);
      return day;
    });
    return { value: isoWeekString(monday), days };
  });
}

function isoWeekString(date: Date): string {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const year = thursday.getUTCFullYear();
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((thursday.getTime() - firstDay.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function weekBounds(value: string): { start: string; end: string } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const januaryFourth = new Date(year, 0, 4);
  const monday = new Date(januaryFourth);
  monday.setDate(januaryFourth.getDate() - ((januaryFourth.getDay() + 6) % 7) + (week - 1) * 7);
  if (isoWeekString(monday) !== value) return null;

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: dateString(monday), end: dateString(sunday) };
}

function dateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string): string {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
