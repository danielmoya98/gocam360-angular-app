import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
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
  protected readonly filterQuery = signal('');

  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly hasError = signal(false);

  // Datos puros provenientes de las señales de lectura del servicio
  protected readonly rawLogs = this._auditService.logs;
  protected readonly serverMeta = this._auditService.meta;

  // Filtrado reactivo derivado automáticamente mediante computed()
  protected readonly filteredLogs = computed(() => {
    const q = this.filterQuery().trim().toLowerCase();
    const all = this.rawLogs();
    if (!q) return all;
    return all.filter(
      (l) =>
        l.userEmail?.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
    );
  });

  protected readonly totalCount = computed(() => {
    return this.serverMeta().total || this.filteredLogs().length;
  });

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  });

  protected readonly paginatedLogs = computed(() => {
    const logs = this.filteredLogs();
    // Si el servidor devolvió la página exacta solicitada, renderizar los logs directamente
    if (this.serverMeta().total > 0 && logs.length <= this.pageSize()) {
      return logs;
    }
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return logs.slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(forceRefresh = false): void {
    this.hasError.set(false);
    this._auditService
      .loadLogs({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.filterQuery(),
        forceRefresh,
      })
      .subscribe({
        next: () => {
          this.hasError.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this._toast.error('Error de Sincronización', 'No se pudieron recuperar los registros de auditoría.');
        },
      });
  }

  onSearchChange(event: Event | string): void {
    const value = typeof event === 'string' ? event : ((event?.target as HTMLInputElement)?.value ?? '');
    this.filterQuery.set(value);
    this.currentPage.set(1);
    this.loadAuditLogs();
  }

  clearSearch(): void {
    this.filterQuery.set('');
    this.currentPage.set(1);
    this.loadAuditLogs();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAuditLogs();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadAuditLogs();
  }
}
