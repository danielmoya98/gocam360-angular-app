import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, submit, required, email, minLength } from '@angular/forms/signals';
import { AuthService } from '../../entities/session/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ToastService } from '../../shared/services/toast.service';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { IconComponent } from '../../shared/ui/icon/icon.component';

export interface TestimonialSlide {
  quote: string;
  author: string;
  role: string;
  image: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormField, HlmButtonDirective, HlmInputDirective, IconComponent],
  template: `
    <div class="min-h-screen w-full flex bg-background text-foreground relative overflow-hidden font-sans select-none transition-colors duration-300">
      
      <!-- Dark/Light Mode Switcher Top Right -->
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

      <!-- LEFT PANEL: Dark Obsidian Hero Panel with Full-Cover Background & Swipe Slider -->
      <div class="hidden lg:flex w-1/2 min-h-screen border-r border-border/80 p-10 flex-col justify-between relative overflow-hidden bg-card">
        
        <!-- Full-Cover Carousel Background Image Layer -->
        <div class="absolute inset-0 z-0">
          <img
            [src]="slides[activeSlideIndex()].image"
            [alt]="slides[activeSlideIndex()].author"
            class="w-full h-full object-cover transition-all duration-700 opacity-40 dark:opacity-30 scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-card/40 to-card"></div>
        </div>

        <!-- Brand Header (Top Left) -->
        <div class="flex items-center gap-3 z-10">
          <div class="w-9 h-9 rounded-xl bg-foreground text-background font-black text-sm flex items-center justify-center shadow-md">
            <app-icon name="dashboard" class="w-5 h-5" />
          </div>
          <div>
            <span class="text-sm font-extrabold tracking-tight text-foreground block leading-none">gocam360</span>
            <span class="text-[10px] text-muted-foreground font-semibold">Enterprise</span>
          </div>
        </div>

        <!-- Bottom Quote & Dynamic Swipe Controls -->
        <div class="z-10 space-y-4 max-w-lg mb-6">
          <blockquote class="space-y-2">
            <p class="text-lg font-medium text-foreground leading-relaxed tracking-tight">
              “{{ slides[activeSlideIndex()].quote }}”
            </p>
            <footer class="text-xs font-semibold text-muted-foreground">
              {{ slides[activeSlideIndex()].author }} — <span class="opacity-80">{{ slides[activeSlideIndex()].role }}</span>
            </footer>
          </blockquote>

          <!-- Carousel Dots Indicator -->
          <div class="flex items-center gap-2 pt-2">
            @for (slide of slides; track $index) {
              <button
                type="button"
                (click)="activeSlideIndex.set($index)"
                class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                [class.w-6]="activeSlideIndex() === $index"
                [class.bg-foreground]="activeSlideIndex() === $index"
                [class.w-1.5]="activeSlideIndex() !== $index"
                [class.bg-muted-foreground/40]="activeSlideIndex() !== $index"
              ></button>
            }
          </div>
        </div>

      </div>

      <!-- RIGHT PANEL: Spanish Email & Password Form -->
      <div class="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10 bg-background text-foreground">
        
        <div class="flex justify-end lg:hidden">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-foreground text-background font-black text-xs flex items-center justify-center">g</div>
            <span class="font-extrabold text-xs text-foreground">gocam360 Enterprise</span>
          </div>
        </div>

        <!-- Form Card Center -->
        <div class="max-w-[350px] w-full mx-auto my-auto space-y-6">
          
          <div class="text-center space-y-1.5">
            <h1 class="text-2xl font-extrabold tracking-tight text-foreground">Iniciar Sesión</h1>
            <p class="text-xs text-muted-foreground">Ingresa tu correo electrónico y contraseña para acceder a la plataforma</p>
          </div>

          <form (submit)="onSubmit(); $event.preventDefault()" class="space-y-3">
            
            <div class="space-y-1">
              <label class="text-xs font-semibold text-foreground">Correo Electrónico</label>
              <input
                type="email"
                hlmInput
                [formField]="loginForm.email"
                placeholder="usuario@gocam360.io"
                class="w-full h-9 px-3 rounded-md bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-0"
              />
              @if (loginForm.email().touched() && loginForm.email().errors().length) {
                <p class="text-[10px] text-rose-500 mt-1 font-medium">{{ loginForm.email().errors()[0].message }}</p>
              }
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-foreground">Contraseña</label>
                <button
                  type="button"
                  (click)="showPassword.update(v => !v)"
                  class="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                >
                  {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                hlmInput
                [formField]="loginForm.password"
                placeholder="••••••••"
                class="w-full h-9 px-3 rounded-md bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-0"
              />
              @if (loginForm.password().touched() && loginForm.password().errors().length) {
                <p class="text-[10px] text-rose-500 mt-1 font-medium">{{ loginForm.password().errors()[0].message }}</p>
              }
            </div>

            <!-- Botón de Iniciar Sesión con Estado de Carga -->
            <button
              type="submit"
              hlmBtn
              class="w-full h-9 rounded-md bg-foreground text-background font-bold text-xs shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
              [disabled]="loginForm().invalid() || authService.isLoading()"
            >
              @if (authService.isLoading()) {
                <app-icon name="refresh" class="w-4 h-4 animate-spin text-background" />
                <span>Verificando credenciales...</span>
              } @else {
                <span>Iniciar Sesión</span>
              }
            </button>

          </form>

          <!-- Aviso de Términos y Privacidad -->
          <p class="text-center text-[10px] text-muted-foreground leading-normal px-2">
            Al hacer clic en Iniciar Sesión, aceptas nuestros
            <a href="#" class="underline hover:text-foreground font-medium">Términos del Servicio</a>
            y
            <a href="#" class="underline hover:text-foreground font-medium">Política de Privacidad</a>.
          </p>
        </div>

        <!-- Footer Copyright -->
        <div class="text-[10px] text-muted-foreground/60 text-center">
          © 2026 gocam360 Inc. Todos los derechos reservados.
        </div>

      </div>

    </div>
  `,
})
export class LoginPage {
  protected readonly authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _toast = inject(ToastService);
  protected readonly themeService = inject(ThemeService);

  protected readonly showPassword = signal(false);
  protected readonly activeSlideIndex = signal(0);

  protected readonly slides: TestimonialSlide[] = [
    {
      quote: "La cola de impresión térmica integrada con la captura de fotos 360° transformó la interacción de nuestros invitados en los eventos.",
      author: "Sofía Martínez",
      role: "Directora de Eventos en L'Oréal",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    },
    {
      quote: "El escaneo de códigos QR y la cuota controlada por invitado nos permitió procesar más de 1,400 impresiones térmicas en una sola noche.",
      author: "Alejandro Rivera",
      role: "VP de Operaciones en ExpoTech",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    },
    {
      quote: "Interfaz hiper-rápida, estética Swiss Obsidian y control instantáneo de galerías digitales.",
      author: "Marcos Chen",
      role: "CTO en Acme Global",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80",
    },
  ];

  protected readonly credentials = signal<LoginDto>({
    email: '',
    password: '',
  });

  protected readonly loginForm = form(this.credentials, (s) => {
    required(s.email, { message: 'Por favor ingresa tu correo electrónico' });
    email(s.email, { message: 'Ingresa un correo electrónico válido' });
    required(s.password, { message: 'La contraseña es obligatoria' });
    minLength(s.password, 6, { message: 'Debe tener al menos 6 caracteres' });
  });

  onSubmit(): void {
    submit(this.loginForm, async () => {
      const { email, password } = this.credentials();
      this.authService.login({ email, password }).subscribe({
        next: () => {
          this._toast.success('Bienvenido de nuevo', 'Sesión iniciada correctamente');
          this._router.navigate(['/dashboard']);
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Credenciales inválidas o error de conexión con el servidor';
          this._toast.error('Error al iniciar sesión', errorMsg);
        },
      });
    });
  }
}
