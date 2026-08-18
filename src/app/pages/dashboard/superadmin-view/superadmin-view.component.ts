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

  protected readonly chartPaths = computed(() => {
    const trends = this.metrics()?.activityTrends || [];
    if (trends.length === 0) {
      return {
        photosPath: 'M 0,90 L 100,70 L 200,80 L 300,50 L 400,60 L 500,40',
        printsPath: 'M 0,105 L 100,95 L 200,100 L 300,80 L 400,85 L 500,70',
        lastPoint: { x: 500, y: 40 },
        months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      };
    }

    const maxVal = Math.max(...trends.flatMap((t) => [t.photos, t.prints]), 10);
    const width = 500;
    const height = 100;
    const step = width / Math.max(1, trends.length - 1);

    const photosPoints = trends.map((t, i) => {
      const x = i * step;
      const y = height - (t.photos / maxVal) * (height - 20) - 10;
      return { x, y, raw: t.photos };
    });

    const printsPoints = trends.map((t, i) => {
      const x = i * step;
      const y = height - (t.prints / maxVal) * (height - 20) - 10;
      return { x, y, raw: t.prints };
    });

    const photosPath = 'M ' + photosPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
    const printsPath = 'M ' + printsPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
    const lastPhoto = photosPoints[photosPoints.length - 1];

    return {
      photosPath,
      printsPath,
      lastPoint: lastPhoto,
      months: trends.map((t) => t.month),
    };
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