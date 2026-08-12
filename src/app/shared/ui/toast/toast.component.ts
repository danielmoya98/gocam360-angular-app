import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  host: {
    class: 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-sm z-[100000] flex flex-col gap-2.5 pointer-events-none w-auto',
  },
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
