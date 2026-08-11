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
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
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
