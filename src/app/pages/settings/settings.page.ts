import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import { ToastService } from '../../shared/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { EventsService, EventItemResponseDto } from '../events/services/events.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormField, IconComponent, HlmInputDirective],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css',
})
export class SettingsPage implements OnInit {
  private readonly _eventsService = inject(EventsService);
  private readonly _toastService = inject(ToastService);

  protected readonly isSaving = signal(false);
  protected readonly eventsList = signal<EventItemResponseDto[]>([]);

  protected readonly settingsModel = signal({
    defaultMaxPhotosPerGuest: 10,
    defaultMaxPrintsPerGuest: 1,
    defaultGalleryRetentionDays: 7,
  });

  protected readonly settingsForm = form(this.settingsModel);

  ngOnInit(): void {
    this._eventsService.findAll().subscribe({
      next: (events) => {
        this.eventsList.set(events);
      },
    });
  }

  onSaveSettings(): void {
    submit(this.settingsForm, async () => {
      this.isSaving.set(true);
      setTimeout(() => {
        this.isSaving.set(false);
        this._toastService.success(
          'Configuración Guardada',
          'Los parámetros por defecto de Prisma y hardware térmico han sido actualizados.'
        );
      }, 500);
    });
  }
}
