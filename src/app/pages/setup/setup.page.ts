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
  template: `
    <div class="min-h-screen w-full flex bg-background text-foreground relative overflow-hidden font-sans select-none transition-colors duration-300">
      
      <!-- Theme Switcher Top Right -->
      <div class="absolute top-5 right-6 z-50">
        <button
          type="button"
          (click)="themeService.toggleTheme()"
          class="w-9 h-9 rounded-full bg-card/90 backdrop-blur-md border border-border/80 flex items-center justify-center text-sm hover:bg-muted transition-all shadow-md text-foreground cursor-pointer"
          title="Cambiar Tema"
        >
          @if (themeService.theme() === 'dark') {
            <app-icon name="sun" class="w-4 h-4 text-amber-400" />
          } @else {
            <app-icon name="moon" class="w-4 h-4 text-zinc-700" />
          }
        </button>
      </div>

      <!-- LEFT PANEL: Dark Obsidian Brand Setup Hero -->
      <div class="hidden lg:flex w-1/2 min-h-screen border-r border-border/80 p-10 flex-col justify-between relative overflow-hidden bg-card">
        <div class="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80"
            alt="gocam360 setup"
            class="w-full h-full object-cover opacity-35 scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-card/40 to-card"></div>
        </div>

        <!-- Brand Header -->
        <div class="relative z-10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-foreground text-background font-black text-2xl flex items-center justify-center border border-border shadow-lg">
            <app-icon name="dashboard" class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-base font-extrabold tracking-tight leading-none text-foreground">gocam360</h1>
            <span class="text-[11px] text-muted-foreground font-semibold">First-Run Setup Wizard</span>
          </div>
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 max-w-lg space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold">
            <app-icon name="shield" class="w-3.5 h-3.5" />
            <span>INICIALIZACIÓN DE PLATAFORMA SAAS</span>
          </div>
          <h2 class="text-3xl font-black tracking-tight text-foreground leading-tight">
            Configura la Cuenta de Administrador Principal
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Estás a un paso de poner en marcha tu plataforma 360°. Define el nombre de tu empresa y crea la cuenta SuperAdmin con control total de la base de datos.
          </p>

          <div class="pt-2 grid grid-cols-3 gap-3">
            <div class="p-3 rounded-xl border border-border/60 bg-popover-solid text-xs space-y-1">
              <span class="text-emerald-400 font-extrabold block">● Paso 1</span>
              <span class="text-foreground font-bold block">SuperAdmin</span>
              <span class="text-[10px] text-muted-foreground">Acceso Máximo API</span>
            </div>
            <div class="p-3 rounded-xl border border-border/60 bg-popover-solid text-xs space-y-1">
              <span class="text-primary font-extrabold block">● Paso 2</span>
              <span class="text-foreground font-bold block">Base de Datos</span>
              <span class="text-[10px] text-muted-foreground">Seeding Automático</span>
            </div>
            <div class="p-3 rounded-xl border border-border/60 bg-popover-solid text-xs space-y-1">
              <span class="text-amber-400 font-extrabold block">● Paso 3</span>
              <span class="text-foreground font-bold block">Seguridad</span>
              <span class="text-[10px] text-muted-foreground">Bloqueo de Setup</span>
            </div>
          </div>
        </div>

        <!-- Footer Notice -->
        <div class="relative z-10 text-[11px] text-muted-foreground font-mono">
          <span>© 2026 gocam360 Enterprise • Security Vault Active</span>
        </div>
      </div>

      <!-- RIGHT PANEL: Setup Form -->
      <div class="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-12 relative bg-background">
        <div class="w-full max-w-md space-y-6">
          
          <!-- Header Title -->
          <div class="space-y-2">
            <div class="lg:hidden flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-xl bg-foreground text-background font-black text-xl flex items-center justify-center border border-border">
                <app-icon name="dashboard" class="w-5 h-5" />
              </div>
              <span class="text-sm font-extrabold text-foreground">gocam360</span>
            </div>

            <h3 class="text-2xl font-black tracking-tight text-foreground">
              Bienvenido a gocam360
            </h3>
            <p class="text-xs text-muted-foreground">
              Completa los datos para crear la primera cuenta SuperAdmin y asegurar el sistema.
            </p>
          </div>

          <!-- Wizard Form -->
          <form (submit)="onSetupSubmit(); $event.preventDefault()" class="space-y-4">
            
            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Nombre de la Organización / Agencia</label>
              <div class="relative flex items-center">
                <app-icon name="events" class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="text"
                  hlmInput
                  [value]="companyName()"
                  (input)="companyName.set($any($event.target).value)"
                  placeholder="Ej. Eventos & Experiencias 360° S.A."
                  class="h-10 w-full pl-9 rounded-lg text-xs"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Nombre Completo del Administrador</label>
              <div class="relative flex items-center">
                <app-icon name="users" class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="text"
                  hlmInput
                  [value]="name()"
                  (input)="name.set($any($event.target).value)"
                  placeholder="Ej. Hugo Mendoza"
                  class="h-10 w-full pl-9 rounded-lg text-xs"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Correo Electrónico (SuperAdmin)</label>
              <div class="relative flex items-center">
                <app-icon name="info" class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="email"
                  hlmInput
                  [value]="email()"
                  (input)="email.set($any($event.target).value)"
                  placeholder="admin@tuempresa.com"
                  class="h-10 w-full pl-9 rounded-lg text-xs"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-foreground">Contraseña Maestra</label>
              <div class="relative flex items-center">
                <app-icon name="shield" class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  hlmInput
                  [value]="password()"
                  (input)="password.set($any($event.target).value)"
                  placeholder="Mínimo 6 caracteres..."
                  class="h-10 w-full pl-9 pr-9 rounded-lg text-xs font-mono"
                />
                <button
                  type="button"
                  (click)="showPassword.update(v => !v)"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                >
                  <app-icon name="eye" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Action Button -->
            <button
              type="submit"
              hlmBtn
              [disabled]="isSubmitting() || authService.isLoading()"
              class="w-full h-10 rounded-lg bg-foreground text-background font-bold text-xs shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              @if (isSubmitting() || authService.isLoading()) {
                <app-icon name="refresh" class="w-4 h-4 animate-spin" />
                <span>Inicializando Sistema...</span>
              } @else {
                <app-icon name="check" class="w-4 h-4" />
                <span>Inicializar & Crear SuperAdmin</span>
              }
            </button>

          </form>

          <div class="p-3 rounded-xl border border-border/80 bg-popover-solid text-popover-foreground text-[11px] text-muted-foreground space-y-1">
            <span class="font-bold text-foreground block">🛡️ Garantía de Seguridad Primera Vez</span>
            <p class="leading-tight">
              Una vez completado el setup, esta pantalla quedará bloqueada permanentemente. Todos los accesos posteriores requerirán inicio de sesión.
            </p>
          </div>

        </div>
      </div>

    </div>
  `,
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
