import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../entities/session/auth.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-splash-loader',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-[999999] bg-card text-foreground flex flex-col items-center justify-center p-6 font-sans select-none overflow-hidden transition-colors duration-300">
      
      <!-- Background Ambient Glow -->
      <div class="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent pointer-events-none"></div>

      <!-- Main Loader Container -->
      <div class="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
        
        <!-- Animated Brand Logo Box with Pulse -->
        <div class="relative">
          <div class="w-16 h-16 rounded-2xl bg-foreground text-background font-black text-3xl flex items-center justify-center border border-border shadow-2xl animate-pulse">
            <app-icon name="dashboard" class="w-9 h-9" />
          </div>
          <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          </div>
        </div>

        <!-- Brand Name & Subtitle -->
        <div class="space-y-1">
          <h1 class="text-xl font-black tracking-tight text-foreground">gocam360</h1>
          <p class="text-[11px] text-muted-foreground font-semibold">Enterprise Platform Engine</p>
        </div>

        <!-- Typing Animation Text Area -->
        <div class="h-8 flex items-center justify-center px-4 py-1.5 rounded-full bg-popover-solid border border-border/80 text-xs font-mono font-medium text-foreground shadow-sm">
          <span class="inline-block leading-none">{{ typedText() }}</span>
          <span class="w-1.5 h-3.5 bg-primary ml-1.5 inline-block animate-pulse"></span>
        </div>

        <!-- Progress Line Bar -->
        <div class="w-48 h-1 rounded-full bg-muted overflow-hidden relative">
          <div class="h-full bg-primary rounded-full animate-[progress_1.2s_ease-in-out_infinite]"></div>
        </div>

      </div>

      <!-- Footer Notice -->
      <div class="absolute bottom-6 text-[10px] text-muted-foreground/60 font-mono">
        Inicializando motor reactivo 360°...
      </div>

    </div>
  `,
  styles: [`
    @keyframes progress {
      0% { width: 0%; transform: translateX(-100%); }
      50% { width: 70%; transform: translateX(20%); }
      100% { width: 100%; transform: translateX(100%); }
    }
  `]
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
