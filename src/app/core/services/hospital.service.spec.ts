import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HospitalService, HospitalRegisterRequest } from './hospital.service';
import { environment } from '../../../environments/environment';

const REGISTER_URL = `${environment.apiUrl}/auth/register/hospital`;

describe('HospitalService', () => {
  let service: HospitalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalService],
    });
    service = TestBed.inject(HospitalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('register', () => {
    it('should POST to /auth/register/hospital with the hospital payload', () => {
      const body: HospitalRegisterRequest = {
        name: 'Hospital Central',
        cnpj: '12345678000100',
        phone: '(11) 99999-9999',
        email: 'contato@hospital.com',
        address: 'Rua A, 100',
        city: 'São Paulo',
        state: 'SP',
        password: 'senha123',
      };

      let result: any;
      service.register(body).subscribe((res) => (result = res));

      const req = httpMock.expectOne(REGISTER_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);

      req.flush({ success: true, data: { id: '1', ...body, active: true } });

      expect(result.id).toBe('1');
      expect(result.active).toBeTrue();
    });

    it('should unwrap the raw response when there is no data envelope', () => {
      const body: HospitalRegisterRequest = {
        name: 'Hospital Central',
        cnpj: '12345678000100',
        phone: '(11) 99999-9999',
        email: 'contato@hospital.com',
        address: 'Rua A, 100',
        city: 'São Paulo',
        state: 'SP',
        password: 'senha123',
      };

      let result: any;
      service.register(body).subscribe((res) => (result = res));

      const req = httpMock.expectOne(REGISTER_URL);
      req.flush({ id: '1', ...body });

      expect(result.id).toBe('1');
    });
  });
});
