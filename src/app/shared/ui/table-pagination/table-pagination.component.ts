import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.css',
})
export class TablePaginationComponent {
  @Input({ required: true }) currentPage = 1;
  @Input({ required: true }) totalPages = 1;
  @Input() pageSize = 10;
  @Input() selectedCount = 0;
  @Input() totalCount = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50];
  @Input() showSelectionInfo = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onPageSizeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSizeChange.emit(Number(target.value));
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
