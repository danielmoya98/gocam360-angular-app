import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [IconComponent],
  host: {
    class: 'contents',
  },
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  private _isOpen = false;
  protected isVisible = signal(false);
  protected isAnimatingIn = signal(false);
  protected isClosing = signal(false);

  @Input() title = '¿Estás seguro?';
  @Input() message = 'Esta acción no se puede deshacer.';

  @Input()
  set isOpen(value: boolean) {
    if (value && !this._isOpen) {
      this._isOpen = true;
      this.isVisible.set(true);
      this.isClosing.set(false);
      this.isAnimatingIn.set(true);
    } else if (!value && this._isOpen) {
      this.triggerCloseAnimation();
    }
  }
  get isOpen(): boolean {
    return this._isOpen;
  }

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<void>();

  close(): void {
    if (this.isClosing()) return;
    this.triggerCloseAnimation();
  }

  confirm(): void {
    this.confirmed.emit();
    this.close();
  }

  private triggerCloseAnimation(): void {
    this.isAnimatingIn.set(false);
    this.isClosing.set(true);
    setTimeout(() => {
      this._isOpen = false;
      this.isVisible.set(false);
      this.isClosing.set(false);
      this.isOpenChange.emit(false);
    }, 200);
  }
}
