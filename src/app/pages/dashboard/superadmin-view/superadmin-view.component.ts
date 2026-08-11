import { Component, EventEmitter, Output, OnInit, inject, signal } from '@angular/core';
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