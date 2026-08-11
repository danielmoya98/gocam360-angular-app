import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type ViewMode = 'cards' | 'table';

@Component({
  selector: 'app-view-switcher',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './view-switcher.component.html',
  styleUrl: './view-switcher.component.css',
})
export class ViewSwitcherComponent {
  @Input({ required: true }) mode: ViewMode = 'table';
  @Output() modeChange = new EventEmitter<ViewMode>();

  setMode(newMode: ViewMode): void {
    if (this.mode !== newMode) {
      this.mode = newMode;
      this.modeChange.emit(newMode);
    }
  }
}
