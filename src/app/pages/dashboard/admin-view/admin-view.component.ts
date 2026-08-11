import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../shared/services/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [IconComponent, RouterLink],
  templateUrl: './admin-view.component.html',
  styleUrl: './admin-view.component.css',
})
export class AdminViewComponent implements OnInit {
  private readonly _adminDashboardService = inject(AdminDashboardService);
  private readonly _toastService = inject(ToastService);

  protected readonly isLoading = this._adminDashboardService.isLoading;
  protected readonly cardsData = computed(() => this._adminDashboardService.metrics()?.cards);
  protected readonly activeEventsList = computed(() => this._adminDashboardService.metrics()?.activeEvents ?? []);
  protected readonly printQueueList = computed(() => this._adminDashboardService.metrics()?.printQueue ?? []);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(notify = false): void {
    this._adminDashboardService.getAdminMetrics(notify).subscribe({
      next: () => {
        if (notify) {
          this._toastService.info('Métricas Actualizadas', 'Datos de eventos e impresiones sincronizados.');
        }
      },
      error: () => {
        if (notify) {
          this._toastService.error('Error', 'No se pudieron recuperar las métricas operativas.');
        }
      },
    });
  }
}
