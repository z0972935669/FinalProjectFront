import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  employeeId: number;
  employmentStatus: boolean;
  departmentId: number | null;
  jobTitleId: number | null;
  name: string | null;
  email: string | null;
}

export interface PagedResult<T> { total: number; items: T[]; }
export interface EmployeeQuery {
  keyword?: string;
  departmentId?: number;
  jobTitleId?: number;
  employmentStatus?: boolean; // true=在職, false=離職
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeListService {
  private http = inject(HttpClient);

  // 直接寫死 API 根路徑
  private readonly apiRoot = 'https://localhost:7124/api';
  private readonly base = `${this.apiRoot}/Employees`;

  // 最簡：抓全部
  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.base);
  }

  // 進階（若你有做 /api/Employees/search）
  search(q: EmployeeQuery): Observable<PagedResult<Employee>> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PagedResult<Employee>>(`${this.base}/search`, { params });
  }
}
