import { Component, Input, Output, EventEmitter, computed, signal, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

export interface TableColumn<T = any> {
  /** Unique key matching the data property */
  key: string;
  /** Display header label */
  label: string;
  /** Optional width (Tailwind class e.g. 'w-40') */
  width?: string;
  /** Optional custom cell formatter */
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
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() actionsTemplate: TemplateRef<any> | null = null;

  @Output() pageChange = new EventEmitter<PageEvent>();

  protected currentPage = signal(1);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['totalItems'] || changes['pageSize']) {
      const maxPage = this.totalPages();
      if (this.currentPage() > maxPage) {
        this.currentPage.set(maxPage);
      }
    }
  }

  protected totalPages = computed(() => {
    const total = this.totalItems > 0 ? this.totalItems : this.data.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  protected paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  });

  protected startItem = computed(() => {
    const total = this.totalItems > 0 ? this.totalItems : this.data.length;
    return total === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1;
  });

  protected endItem = computed(() => {
    const total = this.totalItems > 0 ? this.totalItems : this.data.length;
    return Math.min(this.currentPage() * this.pageSize, total);
  });

  protected visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  protected getCellValue(col: TableColumn, row: any): string {
    const value = row[col.key];
    if (col.format) {
      return col.format(value, row);
    }
    return value ?? '-';
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.pageChange.emit({ page, pageSize: this.pageSize });
    }
  }
}
