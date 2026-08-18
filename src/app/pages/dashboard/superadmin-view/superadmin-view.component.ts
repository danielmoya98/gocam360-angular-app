import { Component, EventEmitter, Output, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../../shared/services/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { DashboardService, SuperAdminMetricsResponseDto } from '../services/dashboard.service';
import { EventsService, EventItemResponseDto } from '../../events/services/events.service';
import { PrintsService, PrintRequestItemDto } from '../../prints/services/prints.service';
import { UsersService, AdminUserResponseDto } from '../../users/services/users.service';
import { AuthService } from '../../../entities/session/auth.service';

export interface TransactionMock {
  id: string;
  customerName: string;
  customerId: string;
  type: string;
  status: 'Approved' | 'Declined' | 'Refunded';
  accountData: string;
  date: string;
  amount: string;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  mobileNumber: string;
}

@Component({
  selector: 'app-superadmin-view',
  standalone: true,
  imports: [IconComponent, DatePipe, RouterLink],
  templateUrl: './superadmin-view.component.html',
  styleUrl: './superadmin-view.component.css',
})
export class SuperadminViewComponent implements OnInit {
  private readonly _dashboardService = inject(DashboardService);
  private readonly _eventsService = inject(EventsService);
  private readonly _printsService = inject(PrintsService);
  private readonly _usersService = inject(UsersService);
  private readonly _authService = inject(AuthService);
  private readonly _toastService = inject(ToastService);

  @Output() selectTransaction = new EventEmitter<TransactionMock>();

  protected readonly isLoading = signal(true);
  protected readonly isGeneratingPdf = signal(false);
  protected readonly metrics = signal<SuperAdminMetricsResponseDto | null>(null);

  protected readonly trendPoints = computed(() => {
    return this.metrics()?.charts?.activityTrends || this.metrics()?.activityTrends || [];
  });

  protected readonly photosSvgPath = computed(() => {
    const trends = this.trendPoints();
    if (trends.length === 0) return 'M 0,100 L 500,100';
    const maxVal = Math.max(...trends.map((t) => Math.max(t.photos, t.prints)), 5);

    const points = trends.map((t, index) => {
      const x = (index / (trends.length - 1 || 1)) * 500;
      const y = 110 - (t.photos / maxVal) * 90;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  });

  protected readonly printsSvgPath = computed(() => {
    const trends = this.trendPoints();
    if (trends.length === 0) return 'M 0,100 L 500,100';
    const maxVal = Math.max(...trends.map((t) => Math.max(t.photos, t.prints)), 5);

    const points = trends.map((t, index) => {
      const x = (index / (trends.length - 1 || 1)) * 500;
      const y = 110 - (t.prints / maxVal) * 90;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  });

  protected readonly lastPointCoord = computed(() => {
    const trends = this.trendPoints();
    if (trends.length === 0) return { x: 500, y: 35 };
    const maxVal = Math.max(...trends.map((t) => Math.max(t.photos, t.prints)), 5);
    const lastPhoto = trends[trends.length - 1].photos;
    const y = 110 - (lastPhoto / maxVal) * 90;
    return { x: 500, y: Number(y.toFixed(1)) };
  });

  protected readonly storageUsedPercent = computed(() => {
    return this.metrics()?.cards?.storage?.storageUsedPercent ?? 0;
  });

  protected readonly storageFreePercent = computed(() => {
    return Math.max(0, 100 - this.storageUsedPercent());
  });

  protected readonly storageDashArray = computed(() => {
    const used = this.storageUsedPercent();
    return `${used}, 100`;
  });

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading.set(true);
    this._dashboardService.getSuperAdminMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  reloadMetrics(): void {
    this.loadMetrics();
    this._toastService.info('Métricas Actualizadas', 'Se recargaron los datos globales de la base de datos');
  }

  // Generación de Reporte Ejecutivo Completo en PDF con jsPDF + autoTable
  exportReport(): void {
    if (this.isGeneratingPdf()) return;
    this.isGeneratingPdf.set(true);
    this._toastService.info('Generando PDF', 'Recopilando datos globales de eventos, impresiones y administradores...');

    forkJoin({
      metrics: this._dashboardService.getSuperAdminMetrics(),
      events: this._eventsService.findAll(true),
      prints: this._printsService.findAll(undefined, true),
      users: this._usersService.findAll(true),
    }).subscribe({
      next: ({ metrics, events, prints, users }) => {
        this.buildPdfDocument(metrics, events, prints, users);
        this.isGeneratingPdf.set(false);
      },
      error: () => {
        this.isGeneratingPdf.set(false);
        this._toastService.error('Error al Generar PDF', 'No se pudieron cargar todos los datos necesarios.');
      },
    });
  }

  private buildPdfDocument(
    metricsData: SuperAdminMetricsResponseDto,
    eventsList: EventItemResponseDto[],
    printsList: PrintRequestItemDto[],
    usersList: AdminUserResponseDto[]
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const currentUser = this._authService.currentUser();
    const emisorName = currentUser?.name || 'Super Admin';
    const emisorEmail = currentUser?.email || 'admin@gocam360.com';
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Encabezado Ejecutivo Estilo Dark Obsidian
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(129, 140, 248); // Indigo 400
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('gocam360', 14, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text('REPORTE EJECUTIVO GLOBAL DE PLATAFORMA', 14, 25);

    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Monitoreo de Almacenamiento Cloudinary, Eventos 360°, Fotos e Impresiones', 14, 32);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Fecha: ${currentDate}`, 145, 16);
    doc.text(`Emisor: ${emisorName}`, 145, 22);
    doc.text(`Perfil: SUPERADMIN`, 145, 28);

    let startY = 46;

    // 2. Sección: Resumen de Indicadores Clave (KPIs)
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN DE INDICADORES CLAVE (KPIs)', 14, startY);

    const cards = metricsData?.cards;
    const adminTotal = cards?.admins?.total ?? usersList.length;
    const adminActive = cards?.admins?.active ?? usersList.filter((u) => u.status).length;
    const adminInactive = cards?.admins?.inactive ?? adminTotal - adminActive;

    const eventTotal = cards?.events?.total ?? eventsList.length;
    const eventActive = cards?.events?.active ?? eventsList.filter((e) => e.status === 'ACTIVE').length;
    const eventFinished = cards?.events?.finished ?? eventTotal - eventActive;

    const storageUsed = cards?.storage?.usedGB ?? 0;
    const storageLimit = cards?.storage?.limitGB ?? 10;
    const storagePercent = cards?.storage?.storageUsedPercent ?? 0;

    const totalPhotos = cards?.photos?.total ?? eventsList.reduce((acc, e) => acc + (e.totalPhotos || 0), 0);
    const totalPrints = cards?.prints?.total ?? printsList.filter((p) => p.status === 'PRINTED').length;

    autoTable(doc, {
      startY: startY + 4,
      head: [['Métrica / Indicador', 'Valor Registrado', 'Detalle / Estado de Plataforma']],
      body: [
        ['Administradores', `${adminTotal} usuarios`, `${adminActive} activos • ${adminInactive} inactivos`],
        ['Eventos 360°', `${eventTotal} eventos`, `${eventActive} en vivo • ${eventFinished} finalizados`],
        ['Fotografías Capturadas', `${totalPhotos} fotos`, `Fotos guardadas en BD y Cloudinary`],
        ['Impresiones Entregadas', `${totalPrints} impresiones`, `Solicitudes térmicas procesadas (PRINTED)`],
        ['Almacenamiento Cloudinary', `${storageUsed} GB de ${storageLimit} GB`, `${storagePercent}% del espacio utilizado en nube`],
      ],
      headStyles: { fillColor: [30, 27, 75], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      theme: 'striped',
    });

    startY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Sección: Distribución de Eventos por Administrador (SuperAdmin vs Admins)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. DISTRIBUCIÓN DE EVENTOS POR ADMINISTRADOR', 14, startY);

    const adminRows = usersList.map((user) => {
      const isSuper = user.role === 'SUPERADMIN';
      const userEvents = eventsList.filter(
        (e) => e.adminId === user.id || (e.adminName && e.adminName.toLowerCase() === user.fullName.toLowerCase())
      );
      const eventNames = userEvents.length > 0 ? userEvents.map((e) => e.title).join(', ') : 'Sin eventos asignados';
      const photosCount = userEvents.reduce((acc, e) => acc + (e.totalPhotos || 0), 0);
      const printsCount = userEvents.reduce((acc, e) => acc + (e.totalPrints || 0), 0);
      const roleLabel = isSuper ? 'SUPER ADMIN (Tú)' : 'ADMINISTRADOR';

      return [
        user.fullName || user.email,
        roleLabel,
        `${userEvents.length} eventos`,
        eventNames,
        `${photosCount} fotos`,
        `${printsCount} imp.`,
      ];
    });

    // En caso de que no haya usuarios cargados
    if (adminRows.length === 0) {
      adminRows.push(['Sin usuarios registrados', 'N/A', '0 eventos', 'Sin eventos asignados', '0 fotos', '0 imp.']);
    }

    autoTable(doc, {
      startY: startY + 4,
      head: [['Administrador', 'Rol', 'Cant. Eventos', 'Lista de Eventos a Cargo', 'Fotos Capt.', 'Impresiones']],
      body: adminRows,
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        3: { cellWidth: 70 }, // Dar espacio a la lista de nombres de eventos
      },
      theme: 'grid',
    });

    startY = (doc as any).lastAutoTable.finalY + 10;

    // Si falta espacio en la página, agregar una página nueva
    if (startY > 220) {
      doc.addPage();
      startY = 20;
    }

    // 4. Sección: Detalle de Eventos y Copias Impresas por Evento
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. DETALLE DE EVENTOS Y COPIAS DE IMPRESIÓN', 14, startY);

    const eventRows = eventsList.map((ev) => {
      const eventPrints = printsList.filter(
        (p) => (p.eventId === ev.id || (p.photo as any)?.eventId === ev.id) && p.status === 'PRINTED'
      );
      const totalCopies = eventPrints.reduce((acc, p) => acc + (p.quantity || 1), 0);
      const printsText = totalCopies > 0 ? `${totalCopies} copias impresas` : 'Sin impresiones registradas';
      const photosText = ev.totalPhotos > 0 ? `${ev.totalPhotos} fotos` : 'Sin fotografías capturadas';

      return [
        ev.title,
        ev.hostName || 'Sin anfitrión',
        ev.adminName || 'Administrador',
        ev.accessCode || ev.uniqueCode || 'N/A',
        photosText,
        printsText,
        ev.status === 'ACTIVE' ? 'EN VIVO' : 'FINALIZADO',
      ];
    });

    if (eventRows.length === 0) {
      eventRows.push(['Sin eventos registrados', 'N/A', 'N/A', 'N/A', 'Sin fotografías capturadas', 'Sin impresiones registradas', 'N/A']);
    }

    autoTable(doc, {
      startY: startY + 4,
      head: [['Nombre del Evento', 'Anfitrión', 'Encargado (admin_id)', 'Código', 'Fotos HD', 'Impresiones Copias', 'Estado']],
      body: eventRows,
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      theme: 'striped',
    });

    // 5. Pie de Página con Numeración Dinámica de Páginas
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${i} de ${totalPages} — Documento Confidencial gocam360 Enterprise`, 14, 290);
      doc.text(`Generado en tiempo real con datos de NestJS & Cloudinary`, 130, 290);
    }

    // Descargar el archivo PDF
    doc.save(`gocam360_reporte_ejecutivo_${new Date().toISOString().substring(0, 10)}.pdf`);
    this._toastService.success('Reporte PDF Descargado', 'Se generó el informe ejecutivo profesional correctamente.');
  }
}