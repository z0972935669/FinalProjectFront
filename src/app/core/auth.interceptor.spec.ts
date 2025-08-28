// src/app/core/auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthInterceptor } from './auth.interceptor';
import { EmployeeAuthService } from '../services/employee/employee-auth.service';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSvc: jasmine.SpyObj<EmployeeAuthService>;

  beforeEach(() => {
    authSvc = jasmine.createSpyObj<EmployeeAuthService>('EmployeeAuthService', ['getToken']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpClientModule],
      providers: [
        { provide: EmployeeAuthService, useValue: authSvc },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds Authorization when token exists', () => {
    authSvc.getToken.and.returnValue('abc123');
    http.get('/api/EmployeeUserAccounts/me').subscribe();
    const req = httpMock.expectOne('/api/EmployeeUserAccounts/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('bypasses login/register endpoints', () => {
    authSvc.getToken.and.returnValue('abc123');

    http.post('/api/EmployeeUserAccounts/login', { u: 'x', p: 'y' }).subscribe();
    const r1 = httpMock.expectOne('/api/EmployeeUserAccounts/login');
    expect(r1.request.headers.has('Authorization')).toBeFalse();
    r1.flush({});

    http.post('/api/EmployeeUserAccounts/register-full', {}).subscribe();
    const r2 = httpMock.expectOne('/api/EmployeeUserAccounts/register-full');
    expect(r2.request.headers.has('Authorization')).toBeFalse();
    r2.flush({});
  });
});
