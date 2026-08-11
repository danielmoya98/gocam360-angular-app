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
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
