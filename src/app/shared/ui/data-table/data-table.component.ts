import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export interface ColumnDef<T = any> {
  header: string;
  field?: string;
  class?: string;
  headerClass?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [IconComponent, NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent<T = any> {
  @Input({ required: true }) columns: ColumnDef<T>[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() isLoading = false;
  @Input() emptyTitle = 'No se encontraron registros';
  @Input() emptySubtitle = 'Intenta ajustar tus criterios de búsqueda o filtros.';
  @Input() emptyIcon: IconName = 'search';

  getCellValue(row: any, field?: string): any {
    if (!field) return '';
    return row[field] ?? '';
  }

  @ContentChild('rowTemplate') rowTemplate?: TemplateRef<any>;
}
