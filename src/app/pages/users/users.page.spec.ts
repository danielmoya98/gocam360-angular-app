import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { UsersPage } from './users.page';
import { UsersService, AdminUserResponseDto } from './services/users.service';
import { environment } from '../../../environments/environment';

describe('UsersPage Component Unit Tests', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;
  let httpMock: HttpTestingController;

  const mockAdmins: AdminUserResponseDto[] = [
    {
      id: 'usr-1',
      fullName: 'Gabriel SuperAdmin',
      email: 'gabriel@gocam360.io',
      role: 'SUPER_ADMIN',
      status: true,
      lastLoginAt: '2026-08-10T12:00:00Z',
      createdAt: '2026-08-01T10:00:00Z',
    },
    {
      id: 'usr-2',
      fullName: 'Sofía Admin',
      email: 'sofia@gocam360.io',
      role: 'ADMIN',
      status: true,
      lastLoginAt: '2026-08-11T15:00:00Z',
      createdAt: '2026-08-02T11:00:00Z',
    },
    {
      id: 'usr-3',
      fullName: 'Diego Inactivo',
      email: 'diego@gocam360.io',
      role: 'ADMIN',
      status: false,
      lastLoginAt: null,
      createdAt: '2026-08-03T09:00:00Z',
    },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        UsersService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component and fetch users on init', async () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAdmins);

    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect((component as any).totalAdminsCount()).toBe(3);
    expect((component as any).activeAdminsCount()).toBe(2);
    expect((component as any).inactiveAdminsCount()).toBe(1);
    expect((component as any).superAdminsCount()).toBe(1);
  });

  it('should filter admins reactively by search query', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush(mockAdmins);
    await fixture.whenStable();

    (component as any).onSearchInput('Sofía');
    await fixture.whenStable();

    const filtered = (component as any).filteredAdmins();
    expect(filtered.length).toBe(1);
    expect(filtered[0].fullName).toBe('Sofía Admin');
  });

  it('should filter admins by status (ACTIVE / INACTIVE)', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush(mockAdmins);
    await fixture.whenStable();

    (component as any).setStatusFilter('INACTIVE');
    await fixture.whenStable();

    let filtered = (component as any).filteredAdmins();
    expect(filtered.length).toBe(1);
    expect(filtered[0].email).toBe('diego@gocam360.io');

    (component as any).setStatusFilter('ACTIVE');
    await fixture.whenStable();

    filtered = (component as any).filteredAdmins();
    expect(filtered.length).toBe(2);
  });

  it('should filter admins by role (SUPER_ADMIN / ADMIN)', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush(mockAdmins);
    await fixture.whenStable();

    (component as any).setRoleFilter('SUPER_ADMIN');
    await fixture.whenStable();

    const filtered = (component as any).filteredAdmins();
    expect(filtered.length).toBe(1);
    expect(filtered[0].role).toBe('SUPER_ADMIN');
  });

  it('should handle select all and bulk delete selections', async () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/users`).flush(mockAdmins);
    await fixture.whenStable();

    expect((component as any).isAllSelected()).toBe(false);

    (component as any).toggleSelectAll();
    expect((component as any).selectedAdminIds().length).toBe(3);
    expect((component as any).isAllSelected()).toBe(true);

    (component as any).toggleSelectAdmin('usr-1');
    expect((component as any).selectedAdminIds().length).toBe(2);
  });

  it('should handle API error state gracefully', async () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();

    expect((component as any).hasError()).toBe(true);
    expect((component as any).isLoading()).toBe(false);
  });
});
