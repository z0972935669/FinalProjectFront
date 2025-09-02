import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateMissingPunchDto {
  workDate: string;        // yyyy-MM-dd
  requestedTime: string;   // HH:mm
  missingType?: 'In' | 'Out';
  applyReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmployeeMissingPunchService {
  private http = inject(HttpClient);
  private readonly apiRoot = 'https://localhost:7124';
  private readonly base = `${this.apiRoot}/api/EmployeeMissingPunchApplications`;

  create(dto: CreateMissingPunchDto): Observable<{ applicationID: number }> {
    return this.http.post<{ applicationID: number }>(
      this.base,
      dto,
      { withCredentials: true }
    );
  }

  my(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/my`, { withCredentials: true });
  }

  detail(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`, { withCredentials: true });
  }
}
