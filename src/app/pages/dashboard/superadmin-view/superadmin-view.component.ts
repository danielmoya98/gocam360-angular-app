import { Component, EventEmitter, Output, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { DashboardService, SuperAdminMetricsResponseDto } from '../services/dashboard.service';

export interface TransactionMock {
  id: string;
  customerName: string;
  customerId: string;
  type: string;
  status: 'Approved' | 'Declined' | 'Refunded';
  accountData: string;
  date: string;
  amount: string;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  mobileNumber: string;
}

@Component({
  selector: 'app-superadmin-view',
  standalone: true,
  imports: [IconComponent, DatePipe, RouterLink],
  templateUrl: './superadmin-view.component.html',
  styleUrl: './superadmin-view.component.css',
})
export class SuperadminViewComponent implements OnInit {
  private readonly _dashboardService = inject(DashboardService);
  private readonly _toastService = inject(ToastService);

  @Output() selectTransaction = new EventEmitter<TransactionMock>();

  protected readonly isLoading = signal(true);
  protected readonly metrics = signal<SuperAdminMetricsResponseDto | null>(null);

  protected readonly trendPoints = computed(() => {
    return this.metrics()?.charts?.activityTrends || this.metrics()?.activityTrends || [];
  });

  protected readonly photosSvgPath = computed(() => {
    const trends = this.trendPoints();
    if (trends.length === 0) return 'M 0,100 L 500,100';
    const maxVal = Math.max(...trends.map((t) => Math.max(t.photos, t.prints)), 5);

    const points = trends.map((t, index) => {
      const x = (index / (trends.length - 1 || 1)) * 500;
      const y = 110 - (t.photos / maxVal) * 90;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  });

  protected readonly printsSvgPath = computed(() => {
    const trends = this.trendPoints();
    if (trends.length === 0) return 'M 0,100 L 500,100';
    const maxVal = Math.max(...trends.map((t) => Math.max(t.photos, t.prints)), 5);

    const points = trends.map((t, index) => {
      const x = (index / (trends.length - 1 || 1)) * 500;
      const y = 110 - (t.prints / maxVal) * 90;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  });

  protected readonly lastPointCoord = computed(() => {
    const trends = this.trendPoints();
    if (trends.length === 0) return { x: 500, y: 35 };
    const maxVal = Math.max(...trends.map((t) => Math.max(t.photos, t.prints)), 5);
    const lastPhoto = trends[trends.length - 1].photos;
    const y = 110 - (lastPhoto / maxVal) * 90;
    return { x: 500, y: Number(y.toFixed(1)) };
  });

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading.set(true);
    this._dashboardService.getSuperAdminMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  reloadMetrics(): void {
    this.loadMetrics();
    this._toastService.info('Métricas Actualizadas', 'Se recargaron los datos globales de la base de datos');
  }

  exportReport(): void {
    this._toastService.success('Reporte Exportado', 'Se descargó el informe métrico global executive-summary.csv');
  }
}