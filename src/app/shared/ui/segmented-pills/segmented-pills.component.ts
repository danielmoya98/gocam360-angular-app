import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedOption {
  label: string;
  value: string;
  count?: number;
  badgeVariant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'primary';
}

@Component({
  selector: 'app-segmented-pills',
  standalone: true,
  templateUrl: './segmented-pills.component.html',
  styleUrl: './segmented-pills.component.css',
})
export class SegmentedPillsComponent {
  @Input({ required: true }) options: SegmentedOption[] = [];
  @Input({ required: true }) selectedValue!: string;

  @Output() valueChange = new EventEmitter<string>();

  selectOption(val: string): void {
    this.selectedValue = val;
    this.valueChange.emit(val);
  }
}
