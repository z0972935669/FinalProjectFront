// employeelistdetail.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

// ⬇️ 加上這兩行（依你的實際路徑調整）
import { EmployeeDetailDto } from '../../../models/employee-detail.dto';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

@Component({
  selector: 'app-employeelistdetail',
  standalone: true,
  templateUrl: './employeelistdetail.component.html',
  styleUrls: ['./employeelistdetail.component.scss'],
  imports: [CommonModule, DatePipe, RouterModule],
})
export class EmployeelistdetailComponent implements OnInit {
  loading = true;
  error: string | null = null;
  vm: EmployeeDetailDto | null = null;

  constructor(private auth: EmployeeAuthService, private router: Router) { }

  ngOnInit(): void {
    const id = this.auth.getEmployeeIdFromToken();
    if (!id) {
      this.router.navigate(['/erp/login'], { queryParams: { returnUrl: '/erp/employeelistdetail' } });
      return;
    }
    this.auth.getEmployeeDetail(id).subscribe({
      next: (dto) => { this.vm = dto; this.loading = false; },
      error: (err) => { this.error = err?.message ?? '載入失敗'; this.loading = false; }
    });
  }
}
