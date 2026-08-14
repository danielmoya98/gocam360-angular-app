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

    const req = httpMock.expectOne(`${environment.apiUrl}/audit-logs`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);

    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect((component as any).filteredLogs().length).toBe(3);
    expect((component as any).paginatedLogs().length).toBe(3);
  });

  it('should filter logs by query (email, action, entity or details)', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/audit-logs`).flush(mockLogs);
    await fixture.whenStable();

    (component as any).onSearchChange('DELETE');
    await fixture.whenStable();

    const filtered = (component as any).filteredLogs();
    expect(filtered.length).toBe(1);
    expect(filtered[0].action).toBe('DELETE_USER');
  });

  it('should clear search filter on clearSearch()', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/audit-logs`).flush(mockLogs);
    await fixture.whenStable();

    (component as any).onSearchChange('DELETE');
    await fixture.whenStable();

    expect((component as any).filteredLogs().length).toBe(1);

    (component as any).clearSearch();
    await fixture.whenStable();

    expect((component as any).filteredLogs().length).toBe(3);
    expect((component as any).filterQuery()).toBe('');
  });

  it('should handle pagination math correctly', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/audit-logs`).flush(mockLogs);
    await fixture.whenStable();

    (component as any).pageSize.set(2);
    await fixture.whenStable();

    expect((component as any).totalPages()).toBe(2);
    expect((component as any).paginatedLogs().length).toBe(2);
  });
});
