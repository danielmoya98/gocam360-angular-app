import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../entities/session/auth.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-splash-loader',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './splash-loader.component.html',
  styleUrl: './splash-loader.component.css',
})
export class SplashLoaderComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  protected readonly typedText = signal('');
  private readonly phrases = [
    'Conectando con base de datos 360°...',
    'Verificando estado de instalación...',
    'Inicializando seguridad de plataforma...',
  ];

  ngOnInit(): void {
    this.startTypingEffect();
    this.evaluateSetup();
  }

  private startTypingEffect(): void {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      const currentPhrase = this.phrases[phraseIndex];

      if (isDeleting) {
        this.typedText.set(currentPhrase.substring(0, charIndex - 1));
        charIndex--;
      } else {
        this.typedText.set(currentPhrase.substring(0, charIndex + 1));
        charIndex++;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        setTimeout(type, 800);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % this.phrases.length;
        setTimeout(type, 300);
      } else {
        setTimeout(type, isDeleting ? 30 : 50);
      }
    };

    type();
  }

  private evaluateSetup(): void {
    if (this._authService.isAuthenticated()) {
      setTimeout(() => this._router.navigate(['/dashboard']), 600);
      return;
    }

    this._authService.checkSetupStatus().subscribe({
      next: (res) => {
        setTimeout(() => {
          if (!res.isInstalled) {
            this._router.navigate(['/setup']);
          } else {
            this._router.navigate(['/login']);
          }
        }, 700);
      },
      error: () => {
        setTimeout(() => this._router.navigate(['/login']), 700);
      },
    });
  }
}
