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

  it('should fetch paginated audit logs from API and set logs and meta signals', () => {
    service.loadLogs({ page: 1, limit: 10 }).subscribe((response) => {
      expect(response.data.length).toBe(2);
      expect(response.data[0].action).toBe('AUTH_LOGIN');
      expect(service.logs().length).toBe(2);
      expect(service.meta().total).toBe(2);
      expect(service.isLoading()).toBe(false);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/audit-logs'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({
      data: mockLogs,
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('should send search parameter to API when search is provided', () => {
    service.loadLogs({ page: 1, limit: 10, search: 'LOGIN' }).subscribe((res) => {
      expect(res.data.length).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/audit-logs'));
    expect(req.request.params.get('search')).toBe('LOGIN');
    req.flush({
      data: [mockLogs[0]],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('should reset signals cleanly if backend returns error 500', () => {
    service.loadLogs({ page: 1, limit: 10 }).subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
        expect(service.logs().length).toBe(0);
        expect(service.isLoading()).toBe(false);
      },
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/audit-logs'));
    req.flush('Server Error', { status: 500, statusText: 'Server Error' });
  });
});
