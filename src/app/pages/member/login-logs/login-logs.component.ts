import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-login-logs',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './login-logs.component.html',
})
export class LoginLogsComponent implements OnInit {
  logs: any[] = [];
  currentPage = 1;
  pageSize = 5;
  totalCount = 0;
  loading = false;
  constructor(private http: HttpClient) {}

ngOnInit(): void {
  //  補上登入驗證
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    location.replace('/login');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() > payload.exp * 1000) throw new Error('expired');
  } catch {
    localStorage.removeItem('jwtToken');
    location.replace('/login');
    return;
  }

  this.loadLogs();
}


  loadLogs(page: number = 1) {
    this.loading = true;

    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any>(`https://localhost:7124/api/account/security-logs?page=${page}&pageSize=${this.pageSize}`, { headers })
      .subscribe({
        next: (res) => {
          this.logs = res.logs;
          this.totalCount = res.totalCount;
          this.currentPage = res.page;
          this.loading = false
        },
        error: (err) => {
          console.error('無法載入登入紀錄', err);
          this.loading = false;
        },
      });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getRegion(log: any): string {
    return log.ipAddress || '未知';
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadLogs(page);
    }
  }
}
