import { Component, Input, Output, EventEmitter, computed, signal, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  format?: (value: any, row: T) => string;
}

export interface PageEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, LucideChevronLeft, LucideChevronRight],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent {
  private readonly _data = signal<any[]>([]);
  private readonly _totalItems = signal(0);
  private readonly _pageSize = signal(10);
  private readonly requestedPage = signal(1);

  @Input() columns: TableColumn[] = [];
  @Input() actionsTemplate: TemplateRef<any> | null = null;

  @Input() set data(value: any[] | null | undefined) {
    this._data.set(value ?? []);
  }
  get data(): any[] {
    return this._data();
  }

  @Input() set totalItems(value: number | null | undefined) {
    this._totalItems.set(value ?? 0);
  }
  get totalItems(): number {
    return this._totalItems();
  }

  @Input() set pageSize(value: number) {
    this._pageSize.set(value > 0 ? value : 10);
  }
  get pageSize(): number {
    return this._pageSize();
  }

  @Input() set page(value: number) {
    if (!Number.isFinite(value)) return;
    this.requestedPage.set(Math.max(1, value));
  }
  get page(): number {
    return this.currentPage();
  }

  @Output() pageChange = new EventEmitter<PageEvent>();

  protected readonly serverSide = computed(
    () => this._totalItems() > this._data().length,
  );

  protected readonly total = computed(() =>
    this.serverSide() ? this._totalItems() : this._data().length,
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this._pageSize())),
  );

  // página pedida, sempre limitada ao total de páginas atual
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(this.requestedPage(), 1), this.totalPages()),
  );

  protected readonly paginatedData = computed(() => {
    if (this.serverSide()) return this._data();
    const size = this._pageSize();
    const start = (this.currentPage() - 1) * size;
    return this._data().slice(start, start + size);
  });

  protected readonly startItem = computed(() =>
    this.total() === 0 ? 0 : (this.currentPage() - 1) * this._pageSize() + 1,
  );

  protected readonly endItem = computed(() =>
    Math.min(this.currentPage() * this._pageSize(), this.total()),
  );

  protected readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  protected getCellValue(col: TableColumn, row: any): string {
    const value = row[col.key];
    return col.format ? col.format(value, row) : (value ?? '-');
  }

  protected goToPage(page: number): void {
    const safePage = Math.min(Math.max(page, 1), this.totalPages());
    if (safePage === this.currentPage()) return;
    this.requestedPage.set(safePage);
    this.pageChange.emit({ page: safePage, pageSize: this._pageSize() });
  }
}