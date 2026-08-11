import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../entities/session/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ToastService } from '../../shared/services/toast.service';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { IconComponent } from '../../shared/ui/icon/icon.component';

export interface SetupDto {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [HlmButtonDirective, HlmInputDirective, IconComponent],
  templateUrl: './setup.page.html',
  styleUrl: './setup.page.css',
})
export class SetupPage {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly _router = inject(Router);
  private readonly _toast = inject(ToastService);

  protected readonly showPassword = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly companyName = signal('gocam360 Enterprise');
  protected readonly name = signal('Hugo Mendoza');
  protected readonly email = signal('superadmin@gocam360.com');
  protected readonly password = signal('');

  onSetupSubmit(): void {
    if (!this.name() || !this.email() || !this.password()) {
      this._toast.error('Campos Incompletos', 'Por favor completa todos los campos requeridos.');
      return;
    }

    if (this.password().length < 6) {
      this._toast.error('Contraseña Corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.isSubmitting.set(true);

    this.authService.createFirstAdmin({
      companyName: this.companyName(),
      name: this.name(),
      email: this.email(),
      password: this.password(),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this._toast.success('¡Plataforma Inicializada!', 'Cuenta de SuperAdmin creada exitosamente.');
        this._router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'No se pudo completar el setup inicial';
        this._toast.error('Error de Setup', msg);
      },
    });
  }
}
