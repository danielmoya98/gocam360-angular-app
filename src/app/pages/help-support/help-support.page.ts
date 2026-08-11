import { Component, inject, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { HlmButtonDirective } from '../../shared/ui/button/hlm-button.directive';
import { SearchInputComponent } from '../../shared/ui/search-input/search-input.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SegmentedPillsComponent, SegmentedOption } from '../../shared/ui/segmented-pills/segmented-pills.component';
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
  imports: [
    IconComponent,
    HlmButtonDirective,
    SearchInputComponent,
    PageHeaderComponent,
    SegmentedPillsComponent,
  ],
  templateUrl: './help-support.page.html',
  styleUrl: './help-support.page.css',
})
export class HelpSupportPage {
  private readonly _toast = inject(ToastService);

  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<string>('ALL');
  protected readonly openFaqIds = signal<string[]>(['f1', 'f2']);

  protected readonly categoryOptions: SegmentedOption[] = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Eventos 360°', value: 'SETUP' },
    { label: 'Impresoras', value: 'PRINTS' },
    { label: 'Web Mobile QR', value: 'MOBILE' },
  ];

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
