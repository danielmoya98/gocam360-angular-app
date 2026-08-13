import { Component, Input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() badgeText?: string;
  @Input() badgeVariant: 'emerald' | 'amber' | 'rose' | 'primary' | 'muted' = 'primary';
  @Input() backLinkUrl?: string;
  @Input() backLinkLabel = 'Volver';
}
