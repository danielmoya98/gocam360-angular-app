import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogDto } from '../../../shared/models/audit.model';
import { environment } from '../../../../environments/environment';

describe('AuditLogsService Unit Tests', () => {
  let service: AuditLogsService;
  let httpMock: HttpTestingController;

  const mockLogs: AuditLogDto[] = [
    {
      id: 'log-101',
      userId: 'usr-1',
      userEmail: 'admin@gocam360.io',
      action: 'AUTH_LOGIN',
      entity: 'User',
      details: 'Inicio de sesión exitoso',
      createdAt: '2026-08-12T10:00:00Z',
    },
    {
      id: 'log-102',
      userId: 'usr-2',
      userEmail: 'operator@gocam360.io',
      action: 'DELETE_USER',
      entity: 'User',
      details: 'Eliminación del administrador Juan',
      createdAt: '2026-08-12T11:30:00Z',
    },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuditLogsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuditLogsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch audit logs from API and set logs signal', () => {
    service.loadLogs(true).subscribe((logs) => {
      expect(logs.length).toBe(2);
      expect(logs[0].action).toBe('AUTH_LOGIN');
      expect(service.logs().length).toBe(2);
      expect(service.isLoading()).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/audit-logs`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);
  });

  it('should return cached logs if forceRefresh is false and logs already exist', () => {
    // First load to populate cache
    service.loadLogs(true).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/audit-logs`).flush(mockLogs);

    // Second call without forceRefresh
    service.loadLogs(false).subscribe((logs) => {
      expect(logs.length).toBe(2);
    });

    // Verify no new HTTP request was made
    httpMock.expectNone(`${environment.apiUrl}/audit-logs`);
  });

  it('should use fallback mock data gracefully if backend fails (500)', () => {
    service.loadLogs(true).subscribe((logs) => {
      expect(logs.length).toBeGreaterThan(0);
      expect(service.isLoading()).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/audit-logs`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
