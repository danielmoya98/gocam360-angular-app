import { Component, Input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() description?: string;
  @Input() icon?: IconName;
  @Input() iconColorClass = 'text-muted-foreground';
  @Input() badgeText?: string;
  @Input() badgeVariant: 'emerald' | 'amber' | 'rose' | 'primary' | 'muted' = 'primary';
  @Input() valueColorClass = 'text-foreground';
  @Input() isLive = false;
}
