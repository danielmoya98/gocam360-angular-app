import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuditLogsPage } from './audit-logs.page';
import { AuditLogsService } from './services/audit-logs.service';
import { AuditLogDto } from '../../shared/models/audit.model';
import { environment } from '../../../environments/environment';

describe('AuditLogsPage Component Unit Tests', () => {
  let component: AuditLogsPage;
  let fixture: ComponentFixture<AuditLogsPage>;
  let httpMock: HttpTestingController;

  const mockLogs: AuditLogDto[] = [
    {
      id: 'log-1',
      userEmail: 'superadmin@gocam360.io',
      action: 'AUTH_LOGIN',
      entity: 'User',
      details: 'Inicio de sesión exitoso',
      createdAt: '2026-08-12T10:00:00Z',
    },
    {
      id: 'log-2',
      userEmail: 'admin@gocam360.io',
      action: 'DELETE_USER',
      entity: 'User',
      details: 'Eliminación del administrador Carlos',
      createdAt: '2026-08-12T11:00:00Z',
    },
    {
      id: 'log-3',
      userEmail: 'operator@gocam360.io',
      action: 'UPDATE_EVENT',
      entity: 'Event',
      details: 'Actualización del evento L\'Oréal 360°',
      createdAt: '2026-08-12T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuditLogsPage],
      providers: [
        AuditLogsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component and load logs on init', async () => {
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.endsWith('/audit-logs'));
    expect(req.request.method).toBe('GET');
    req.flush({
      data: mockLogs,
      meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
    });

    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect((component as any).filteredLogs().length).toBe(3);
    expect((component as any).paginatedLogs().length).toBe(3);
  });

  it('should filter logs by query reactively using computed signal', async () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.endsWith('/audit-logs')).flush({
      data: mockLogs,
      meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
    });
    await fixture.whenStable();

    (component as any).onSearchChange('DELETE');
    const req = httpMock.expectOne((r) => r.url.endsWith('/audit-logs'));
    expect(req.request.params.get('search')).toBe('DELETE');
    req.flush({
      data: [mockLogs[1]],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    await fixture.whenStable();

    const filtered = (component as any).filteredLogs();
    expect(filtered.length).toBe(1);
    expect(filtered[0].action).toBe('DELETE_USER');
  });

  it('should clear search filter on clearSearch() and trigger fresh load', async () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.endsWith('/audit-logs')).flush({
      data: mockLogs,
      meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
    });
    await fixture.whenStable();

    (component as any).clearSearch();
    const req = httpMock.expectOne((r) => r.url.endsWith('/audit-logs'));
    req.flush({
      data: mockLogs,
      meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
    });
    await fixture.whenStable();

    expect((component as any).filteredLogs().length).toBe(3);
    expect((component as any).filterQuery()).toBe('');
  });

  it('should handle pagination math correctly with computed totalPages', async () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.endsWith('/audit-logs')).flush({
      data: mockLogs,
      meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
    });
    await fixture.whenStable();

    expect((component as any).totalPages()).toBe(3);
  });
});
