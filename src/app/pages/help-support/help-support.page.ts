import { Component, inject, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmInputDirective } from '../../shared/ui/input/hlm-input.directive';
import { ToastService } from '../../shared/services/toast.service';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'SETUP' | 'HARDWARE' | 'PRINTS' | 'MOBILE';
  isOpen?: boolean;
}

@Component({
  selector: 'app-help-support-page',
  standalone: true,
  imports: [IconComponent, HlmInputDirective],
  template: `
    <div class="h-full flex flex-col min-h-0 space-y-4 overflow-y-auto no-scrollbar pb-6 animate-in fade-in duration-300">
      
      <!-- Top Title Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold font-mono">
              CENTRO DE AYUDA & SOPORTE TÉCNICO 360°
            </span>
            <span class="text-[10px] text-muted-foreground font-mono">DOCUMENTACIÓN Y ASISTENCIA</span>
          </div>
          <h2 class="text-xl font-extrabold tracking-tight text-foreground">Ayuda, FAQ y Soporte Comercial</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Encuentra respuestas rápidas para la configuración de eventos 360°, impresoras térmicas y asistencia personalizada.</p>
        </div>

        <div class="flex items-center gap-2">
          <a
            href="https://wa.me/525512345678?text=Hola%20Soporte%20gocam360,%20requiero%20asistencia%20en%20vivo."
            target="_blank"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <app-icon name="phone" class="w-3.5 h-3.5 text-white" />
            <span>Soporte WhatsApp En Vivo</span>
          </a>
        </div>
      </div>

      <!-- Tarjetas de Acceso Rápido / Contacto -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <div class="p-4 rounded-xl border border-border/80 bg-popover-solid space-y-2 shadow-none hover:border-primary/50 transition-all group">
          <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <app-icon name="events" class="w-5 h-5" />
          </div>
          <h3 class="text-sm font-extrabold text-foreground">Guía Rápida de Eventos</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">Aprende a crear eventos 360°, personalizar marcas de agua PNG y generar códigos QR de acceso instantáneo.</p>
        </div>

        <div class="p-4 rounded-xl border border-border/80 bg-popover-solid space-y-2 shadow-none hover:border-amber-500/50 transition-all group">
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <app-icon name="printer" class="w-5 h-5" />
          </div>
          <h3 class="text-sm font-extrabold text-foreground">Hardware & Impresión Térmica</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">Conexión de impresoras térmicas DNP/Fuji por USB o cola de red y configuración de formatos de foto 10x15.</p>
        </div>

        <div class="p-4 rounded-xl border border-border/80 bg-popover-solid space-y-2 shadow-none hover:border-emerald-500/50 transition-all group">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <app-icon name="shield" class="w-5 h-5" />
          </div>
          <h3 class="text-sm font-extrabold text-foreground">Seguridad & CRM Prospectos</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">Captación de números móviles con código OTP y seguimiento de clientes interesados vía WhatsApp.</p>
        </div>
      </div>

      <!-- Buscador de Preguntas Frecuentes -->
      <div class="p-4 rounded-xl border border-border/80 bg-popover-solid text-popover-foreground flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-none">
        <div class="relative flex items-center w-full md:w-80">
          <app-icon name="search" class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            hlmInput
            placeholder="Buscar en preguntas frecuentes..."
            [value]="searchQuery()"
            (input)="onSearchChange($event)"
            class="h-9 w-full pl-9 text-xs rounded-md"
          />
        </div>

        <!-- Categorías Pills -->
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-muted/40 rounded-xl border border-border/60">
          <button
            type="button"
            (click)="selectedCategory.set('ALL')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            [class.bg-background]="selectedCategory() === 'ALL'"
            [class.text-foreground]="selectedCategory() === 'ALL'"
            [class.shadow-sm]="selectedCategory() === 'ALL'"
            [class.text-muted-foreground]="selectedCategory() !== 'ALL'"
          >
            Todas
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('SETUP')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            [class.bg-background]="selectedCategory() === 'SETUP'"
            [class.text-foreground]="selectedCategory() === 'SETUP'"
            [class.shadow-sm]="selectedCategory() === 'SETUP'"
            [class.text-muted-foreground]="selectedCategory() !== 'SETUP'"
          >
            Eventos 360°
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('PRINTS')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            [class.bg-background]="selectedCategory() === 'PRINTS'"
            [class.text-foreground]="selectedCategory() === 'PRINTS'"
            [class.shadow-sm]="selectedCategory() === 'PRINTS'"
            [class.text-muted-foreground]="selectedCategory() !== 'PRINTS'"
          >
            Impresoras
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('MOBILE')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            [class.bg-background]="selectedCategory() === 'MOBILE'"
            [class.text-foreground]="selectedCategory() === 'MOBILE'"
            [class.shadow-sm]="selectedCategory() === 'MOBILE'"
            [class.text-muted-foreground]="selectedCategory() !== 'MOBILE'"
          >
            Web Mobile QR
          </button>
        </div>
      </div>

      <!-- Lista Acordeón Interactivo de FAQ (bg-popover-solid 100% Sólido) -->
      <div class="rounded-xl border border-border/80 bg-popover-solid text-popover-foreground p-4 space-y-3 shadow-none flex-1">
        <h3 class="text-sm font-extrabold text-foreground pb-2 border-b border-border/60">Preguntas Frecuentes Respondidas</h3>

        <div class="space-y-2">
          @for (faq of filteredFaqs(); track faq.id) {
            <div class="border border-border/70 rounded-xl overflow-hidden bg-card transition-all">
              <button
                type="button"
                (click)="toggleFaq(faq.id)"
                class="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span class="text-xs font-extrabold text-foreground flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  {{ faq.question }}
                </span>
                <app-icon
                  name="chevron-down"
                  class="w-4 h-4 text-muted-foreground transition-transform duration-200"
                  [class.rotate-180]="openFaqIds().includes(faq.id)"
                />
              </button>

              @if (openFaqIds().includes(faq.id)) {
                <div class="p-3.5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/10 animate-in fade-in duration-150">
                  {{ faq.answer }}
                </div>
              }
            </div>
          } @empty {
            <div class="p-10 text-center text-muted-foreground">
              <div class="max-w-xs mx-auto space-y-2">
                <app-icon name="help" class="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <h4 class="text-sm font-bold text-foreground">No encontramos esa respuesta</h4>
                <p class="text-xs">Prueba con otra palabra clave en el buscador o contacta al soporte por WhatsApp.</p>
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="mt-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold cursor-pointer text-foreground transition-all"
                >
                  Ver Todas las Preguntas
                </button>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class HelpSupportPage {
  private readonly _toast = inject(ToastService);

  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<string>('ALL');
  protected readonly openFaqIds = signal<string[]>(['f1', 'f2']);

  protected readonly faqs = signal<FaqItem[]>([
    {
      id: 'f1',
      question: '¿Cómo funciona la captura móvil de invitados mediante código QR?',
      answer: 'Cada evento genera un código QR exclusivo. Cuando los invitados lo escanean con sus teléfonos, acceden a la vista web móvil de invitados donde registran su teléfono con código OTP y pueden subir o grabar videos 360°.',
      category: 'MOBILE',
    },
    {
      id: 'f2',
      question: '¿Cómo conectar una impresora térmica DNP o Fuji a la cola de impresión?',
      answer: 'Ve al menú de Impresiones. La aplicación procesa el marco de agua en formato PNG y envía el trabajo directo a la cola térmica local o mediante la API de impresiones.',
      category: 'PRINTS',
    },
    {
      id: 'f3',
      question: '¿Cómo personalizar el marco de fotos overlay PNG para un nuevo evento?',
      answer: 'Al crear o editar un evento en el módulo de Eventos 360°, sube el archivo PNG con transparencia en la sección Marco Personalizado.',
      category: 'SETUP',
    },
    {
      id: 'f4',
      question: '¿Dónde se almacenan los prospectos comerciales capturados?',
      answer: 'Todos los números telefónicos y datos capturados durante la transmisión 360° se envían en tiempo real a la pestaña CRM Prospectos, permitiendo contacto directo por WhatsApp en un clic.',
      category: 'SETUP',
    },
    {
      id: 'f5',
      question: '¿Cómo proyectar el Muro en Vivo en pantallas secundarias o proyectores?',
      answer: 'En la lista de eventos, abre las opciones de los 3 puntos (...) y selecciona Muro en Vivo. Abre este enlace en la pantalla o televisor del evento para ver las capturas a 60 FPS.',
      category: 'MOBILE',
    },
  ]);

  protected filteredFaqs(): FaqItem[] {
    let list = this.faqs();
    const query = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();

    if (cat !== 'ALL') {
      list = list.filter((f) => f.category === cat);
    }

    if (query) {
      list = list.filter((f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query));
    }

    return list;
  }

  toggleFaq(id: string): void {
    this.openFaqIds.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');
  }
}
