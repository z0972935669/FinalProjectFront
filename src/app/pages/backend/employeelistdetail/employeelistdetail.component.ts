import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

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

  /** 目前正在檢視的員工ID（模板也會用到） */
  currentId!: number;

  /** 後端靜態檔的預設頭像（依實際調整） */
  readonly FALLBACK_PHOTO = 'https://localhost:7124/images/employees/noimage.jpg';
  /** 綁定到 <img [src]>；vm 載入時設定 */
  photoUrl = this.FALLBACK_PHOTO;

  constructor(
    private route: ActivatedRoute,
    private auth: EmployeeAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 用 paramMap 監聽路由變化：同一組件被重用時(切換不同 :id)也會重新載入
    this.route.paramMap.subscribe((pm) => {
      const fromRoute = pm.get('id');
      const myId = this.auth.getEmployeeIdFromToken(); // 允許不帶 id 時看自己
      const id = fromRoute ? Number(fromRoute) : Number(myId);

      if (!id || Number.isNaN(id)) {
        // 沒 id、也沒有登入：導去登入並帶回跳網址
        this.router.navigate(['/erp/login'], {
          queryParams: { returnUrl: '/erp/employeelistdetail' },
        });
        return;
      }

      this.currentId = id;
      this.loadDetail(id);
    });
  }

  private loadDetail(id: number) {
    this.loading = true;
    this.error = null;

    this.auth.getEmployeeDetail(id).subscribe({
      next: (dto) => {
        this.vm = dto;
        // 若服務已回傳完整 URL 直接用；否則退回預設圖
        this.photoUrl = dto?.PhotoPath?.trim() ? dto.PhotoPath : this.FALLBACK_PHOTO;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message ?? '載入失敗';
        this.loading = false;
      },
    });
  }

  /** <img> 載入失敗時回退預設圖 */
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img && img.src !== this.FALLBACK_PHOTO) img.src = this.FALLBACK_PHOTO;
  }

  /** 供模板綁定的導頁方法（也可以用 routerLink 寫法，見下方備註） */
  goEdit() {
    this.router.navigate(['/erp/employeelistedit', this.currentId]);
  }
  goList() {
    this.router.navigate(['/erp/employeelist']);
  }
}
