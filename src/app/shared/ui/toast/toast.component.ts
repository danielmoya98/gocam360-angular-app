import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  host: {
    class: 'fixed bottom-5 right-5 z-[100000] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full',
  },
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start justify-between gap-3 bg-popover-solid text-popover-foreground border-border relative z-[100001]"
        [class.animate-toast-in]="!toast.isClosing"
        [class.animate-toast-out]="toast.isClosing"
        [class.border-l-4]="true"
        [class.border-l-emerald-500]="toast.type === 'success'"
        [class.border-l-rose-500]="toast.type === 'error'"
        [class.border-l-blue-500]="toast.type === 'info'"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') {
              <app-icon name="check" class="w-4 h-4 text-emerald-500" />
            } @else if (toast.type === 'error') {
              <app-icon name="trash" class="w-4 h-4 text-rose-500" />
            } @else {
              <app-icon name="info" class="w-4 h-4 text-blue-500" />
            }
          </div>
          <div>
            <h5 class="text-xs font-bold leading-none text-foreground">{{ toast.title }}</h5>
            @if (toast.message) {
              <p class="text-[11px] text-muted-foreground mt-1 leading-tight">{{ toast.message }}</p>
            }
          </div>
        </div>

        <button
          type="button"
          (click)="toastService.remove(toast.id)"
          class="text-xs text-muted-foreground hover:text-foreground transition-opacity p-0.5 rounded hover:bg-muted"
        >
          ✕
        </button>
      </div>
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
