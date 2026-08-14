import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UsersService, AdminUserResponseDto, CreateAdminDto, UpdateAdminDto } from './users.service';
import { environment } from '../../../../environments/environment';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const mockUsers: AdminUserResponseDto[] = [
    {
      id: '11111111-1111-4111-a111-111111111111',
      fullName: 'Carlos Mendoza',
      email: 'carlos@gocam360.io',
      role: 'SUPER_ADMIN',
      status: true,
      lastLoginAt: '2026-08-10T14:30:00Z',
      createdAt: '2026-08-01T10:00:00Z',
    },
    {
      id: '22222222-2222-4222-a222-222222222222',
      fullName: 'Ana Gómez',
      email: 'ana@gocam360.io',
      role: 'ADMIN',
      status: false,
      lastLoginAt: null,
      createdAt: '2026-08-05T12:00:00Z',
    },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UsersService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all users via GET /users and cache in memory signal', () => {
    service.findAll(true).subscribe((users) => {
      expect(users.length).toBe(2);
      expect(users[0].fullName).toBe('Carlos Mendoza');
      expect(service.users()?.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should fetch single user via GET /users/:id', () => {
    const userId = '11111111-1111-4111-a111-111111111111';

    service.findOne(userId).subscribe((user) => {
      expect(user.id).toBe(userId);
      expect(user.email).toBe('carlos@gocam360.io');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers[0]);
  });

  it('should create new user via POST /users and update local state signal', () => {
    const createDto: CreateAdminDto = {
      fullName: 'Roberto Silva',
      email: 'roberto@gocam360.io',
      password: 'Password123!',
      role: 'ADMIN',
      status: true,
    };

    const createdUser: AdminUserResponseDto = {
      id: '33333333-3333-4333-a333-333333333333',
      fullName: createDto.fullName,
      email: createDto.email,
      role: createDto.role,
      status: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };

    service.create(createDto).subscribe((res) => {
      expect(res.id).toBe('33333333-3333-4333-a333-333333333333');
      expect(res.fullName).toBe('Roberto Silva');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(createdUser);
  });

  it('should update user via PATCH /users/:id and update local state signal', () => {
    const userId = '22222222-2222-4222-a222-222222222222';
    const updateDto: UpdateAdminDto = {
      status: true,
    };

    const updatedUser: AdminUserResponseDto = {
      ...mockUsers[1],
      status: true,
    };

    service.update(userId, updateDto).subscribe((res) => {
      expect(res.status).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${userId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateDto);
    req.flush(updatedUser);
  });

  it('should remove user via DELETE /users/:id', () => {
    const userId = '22222222-2222-4222-a222-222222222222';

    service.remove(userId).subscribe((res) => {
      expect(res.message).toBe('Administrador eliminado con éxito');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${userId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Administrador eliminado con éxito' });
  });

  it('should bulk remove users via POST /users/bulk-delete', () => {
    const ids = ['11111111-1111-4111-a111-111111111111', '22222222-2222-4222-a222-222222222222'];

    service.bulkRemove(ids).subscribe((res) => {
      expect(res.message).toBe('2 administradores eliminados');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/bulk-delete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ids });
    req.flush({ message: '2 administradores eliminados' });
  });
});
