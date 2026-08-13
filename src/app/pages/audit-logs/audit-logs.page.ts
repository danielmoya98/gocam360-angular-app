import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SearchInputComponent } from '../../shared/ui/search-input/search-input.component';
import { TablePaginationComponent } from '../../shared/ui/table-pagination/table-pagination.component';
import { ToastService } from '../../shared/services/toast.service';
import { AuditLogsService } from './services/audit-logs.service';
import { AuditLogDto } from '../../shared/models/audit.model';

export type { AuditLogDto };

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [
    IconComponent,
    DatePipe,
    PageHeaderComponent,
    SearchInputComponent,
    TablePaginationComponent
  ],
  templateUrl: './audit-logs.page.html',
  styleUrl: './audit-logs.page.css',
})
export class AuditLogsPage implements OnInit {
  private readonly _auditService = inject(AuditLogsService);
  private readonly _toast = inject(ToastService);

  protected readonly isLoading = this._auditService.isLoading;
  private readonly _logs = this._auditService.logs;
  protected readonly filterQuery = signal('');

  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly filteredLogs = signal<AuditLogDto[]>([]);

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredLogs().length / this.pageSize()) || 1
  );

  protected readonly paginatedLogs = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLogs().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(forceRefresh = false): void {
    this._auditService.loadLogs(forceRefresh).subscribe({
      next: () => this.applyFilter(),
      error: () => {
        this._toast.info('Bitácora', 'No se pudieron sincronizar los datos.');
      },
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filterQuery.set(target.value.toLowerCase());
    this.applyFilter();
  }

  clearSearch(): void {
    this.filterQuery.set('');
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.filterQuery();
    const allLogs = this._auditService.logs();
    if (!q) {
      this.filteredLogs.set(allLogs);
      return;
    }
    this.filteredLogs.set(
      allLogs.filter(
        (l: AuditLogDto) =>
          l.userEmail?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      )
    );
  }
}
