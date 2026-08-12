import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { HlmButtonDirective } from '../button/hlm-button.directive';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [IconComponent, HlmButtonDirective],
  template: `
    <div class="min-h-[350px] flex-1 rounded-xl border border-rose-500/30 bg-rose-500/5 text-foreground p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
      <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-inner">
        <app-icon name="info" class="w-7 h-7 text-rose-500" />
      </div>

      <div class="max-w-md space-y-1.5">
        <h3 class="text-base font-extrabold text-foreground tracking-tight">
          {{ title }}
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          {{ message }}
        </p>
      </div>

      <div class="pt-2 flex items-center gap-3">
        <button
          type="button"
          hlmBtn
          variant="outline"
          size="sm"
          (click)="onRetry.emit()"
          class="font-bold cursor-pointer border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
        >
          <app-icon name="refresh" class="w-3.5 h-3.5 mr-1.5" />
          <span>Reintentar Cargar</span>
        </button>

        <button
          type="button"
          hlmBtn
          variant="ghost"
          size="sm"
          (click)="reloadPage()"
          class="font-medium cursor-pointer text-muted-foreground hover:text-foreground"
        >
          Recargar Página
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class ErrorBoundaryComponent {
  @Input() title = '¡Ups! Ocurrió un fallo inesperado';
  @Input() message = 'Se produjo un error al procesar esta vista. No te preocupes, los datos están seguros. Intenta reintentar o recargar la página.';

  @Output() onRetry = new EventEmitter<void>();

  reloadPage(): void {
    window.location.reload();
  }
}
