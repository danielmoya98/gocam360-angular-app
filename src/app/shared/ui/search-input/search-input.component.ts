import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
})
export class SearchInputComponent {
  @Input() value = '';
  @Input() placeholder = 'Buscar...';
  @Input() containerClass = 'w-full sm:w-72';

  @Output() valueChange = new EventEmitter<string>();
  @Output() searchInput = new EventEmitter<Event>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
    this.searchInput.emit(event);
  }
}
