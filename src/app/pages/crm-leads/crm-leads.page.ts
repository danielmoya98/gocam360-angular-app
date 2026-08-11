import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { SegmentedPillsComponent } from '../../shared/ui/segmented-pills/segmented-pills.component';
import { SearchInputComponent } from '../../shared/ui/search-input/search-input.component';
import { TablePaginationComponent } from '../../shared/ui/table-pagination/table-pagination.component';
import { ToastService } from '../../shared/services/toast.service';
import { CrmLeadsService, CrmLeadDto, LeadStatus } from './services/crm-leads.service';

@Component({
  selector: 'app-crm-leads-page',
  standalone: true,
  imports: [
    IconComponent,
    DatePipe,
    HlmInputDirective,
    PageHeaderComponent,
    KpiCardComponent,
    SegmentedPillsComponent,
    SearchInputComponent,
    TablePaginationComponent,
  ],
  templateUrl: './crm-leads.page.html',
  styleUrl: './crm-leads.page.css',
})
export class CrmLeadsPage implements OnInit {
  private readonly _crmService = inject(CrmLeadsService);
  private readonly _toast = inject(ToastService);

  protected readonly isLoading = this._crmService.isLoading;
  protected readonly leads = this._crmService.leads;

  protected readonly searchFilter = signal('');
  protected readonly statusFilter = signal<string>('ALL');

  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly filteredLeads = computed(() => {
    let result = this.leads();
    const query = this.searchFilter().toLowerCase();
    const status = this.statusFilter();

    if (status !== 'ALL') {
      result = result.filter((l) => l.status === status);
    }

    if (query) {
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.phone.toLowerCase().includes(query) ||
          l.notes?.toLowerCase().includes(query)
      );
    }

    return result;
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredLeads().length / this.pageSize()) || 1
  );

  protected readonly paginatedLeads = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLeads().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(notify = false): void {
    this._crmService.loadLeads().subscribe({
      next: () => {
        if (notify) this._toast.info('Sincronización Exitosa', 'Lista de leads actualizada.');
      },
    });
  }

  countByStatus(status: LeadStatus): number {
    return this.leads().filter((l) => l.status === status).length;
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchFilter.set(target.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  changeLeadStatus(id: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as LeadStatus;
    this._crmService.updateLeadStatus(id, newStatus).subscribe({
      next: () => {
        this._toast.success('Estado Actualizado', `Lead cambiado a ${newStatus}`);
      },
    });
  }

  clearFilters(): void {
    this.searchFilter.set('');
    this.statusFilter.set('ALL');
  }

  openWhatsApp(lead: CrmLeadDto): void {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola ${lead.name}! Vimos tu interés en contratar la plataforma 360° e impresión instantánea para tu próximo evento. ¿Cómo podemos ayudarte?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  }
}
