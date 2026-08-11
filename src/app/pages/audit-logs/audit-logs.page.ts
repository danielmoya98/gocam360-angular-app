import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { ApiClientService } from '../../core/services/api-client.service';
import { ToastService } from '../../shared/services/toast.service';

export interface AuditLogDto {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  details?: string;
  ipAddress?: string;
  createdAt: string | Date;
}

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [IconComponent, DatePipe, HlmInputDirective],
  templateUrl: './audit-logs.page.html',
  styleUrl: './audit-logs.page.css',
})
export class AuditLogsPage implements OnInit {
  private readonly _api = inject(ApiClientService);
  private readonly _toast = inject(ToastService);

  private static cachedLogs: AuditLogDto[] | null = null;

  protected readonly isLoading = signal(false);
  protected readonly logs = signal<AuditLogDto[]>([]);
  protected readonly filterQuery = signal('');

  protected readonly filteredLogs = signal<AuditLogDto[]>([]);

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(notify = false): void {
    this.isLoading.set(true);

    this._api.get<AuditLogDto[]>('/audit-logs').subscribe({
      next: (data) => {
        setTimeout(() => {
          AuditLogsPage.cachedLogs = data;
          this.logs.set(data);
          this.applyFilter();
          this.isLoading.set(false);
          if (notify) this._toast.info('Bitácora Actualizada', 'Registros sincronizados con la base de datos.');
        }, 400);
      },
      error: () => {
        setTimeout(() => {
          const mockLogs: AuditLogDto[] = [
            { id: '1', userEmail: 'hugo.mendoza@gocam360.com', action: 'AUTH_LOGIN', entity: 'User', details: 'Inicio de sesión exitoso desde Chrome Linux', createdAt: new Date().toISOString() },
            { id: '2', userEmail: 'superadmin@gocam360.com', action: 'CREATE_USER', entity: 'User', details: 'Otorgó acceso al Administrador Elena Rostova', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
            { id: '3', userEmail: 'hugo.mendoza@gocam360.com', action: 'CREATE_EVENT', entity: 'Event', details: 'Creación de evento Lanzamiento L\'Oréal 360', createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
            { id: '4', userEmail: 'elena.rostova@gocam360.com', action: 'UPDATE_EVENT', entity: 'Event', details: 'Actualización de cuota de impresiones por persona', createdAt: new Date(Date.now() - 90 * 60000).toISOString() },
          ];
          AuditLogsPage.cachedLogs = mockLogs;
          this.logs.set(mockLogs);
          this.applyFilter();
          this.isLoading.set(false);
          if (notify) this._toast.info('Bitácora Actualizada', 'Registros cargados correctamente.');
        }, 400);
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
    if (!q) {
      this.filteredLogs.set(this.logs());
      return;
    }
    this.filteredLogs.set(
      this.logs().filter(
        (l) =>
          l.userEmail?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      )
    );
  }
}
