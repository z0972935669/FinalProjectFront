import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { take, switchMap, of, map } from 'rxjs';
import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';

type EmployeeDetailDto = any; // 你的 DTO 介面（此處簡化）

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

  currentId!: number;
  readonly FALLBACK_PHOTO = 'assets/backend/images/logo/user.png';
  photoUrl = this.FALLBACK_PHOTO;

  /** ✅ 新增：性別顯示文字 */
  genderText = '—';

  constructor(
    private route: ActivatedRoute,
    private auth: EmployeeAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        take(1),
        switchMap(pm => {
          // 1) URL 有 id → 直接用
          const fromRoute = pm.get('id');
          if (fromRoute) {
            const id = Number(fromRoute);
            return of(!Number.isNaN(id) && id > 0 ? id : null);
          }

          // 2) 沒 id → 試著從快取拿 employeeId
          const cached = this.auth.getEmployeeIdCached();
          if (cached) return of(cached);

          // 3) 快取也沒有 → 打 /me
          return this.auth.fetchMe().pipe(map(me => me.id));
        })
      )
      .subscribe(id => {
        if (!id) {
          this.router.navigate(['/erp/login'], {
            queryParams: { returnUrl: '/erp/employeelistdetail' },
            replaceUrl: true,
          });
        } else {
          this.currentId = id;
          this.loadDetail(id);
        }
      });
  }

  private loadDetail(id: number) {
    this.loading = true;
    this.error = null;

    this.auth.getEmployeeDetail(id).subscribe({
      next: (dto) => {
        this.vm = dto;
        this.photoUrl = dto?.PhotoPath?.trim() ? dto.PhotoPath : this.FALLBACK_PHOTO;
        this.genderText = this.getGenderText(dto);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? '載入失敗';
        this.loading = false;
      },
    });
  }

  /** 通用性別轉文字：支援 Gender/Sex/GenderText、多種型別 */
  private getGenderText(d: any): string {
    const v =
      d?.Gender ?? d?.gender ??
      d?.Sex ?? d?.sex ??
      d?.GenderText ?? d?.genderText ?? null;

    if (v == null) return '—';

    // boolean
    if (typeof v === 'boolean') return v ? '男' : '女';

    // number 1/0
    if (typeof v === 'number') return v === 1 ? '男' : v === 0 ? '女' : '—';

    // string：轉小寫處理
    const s = String(v).trim();
    const lower = s.toLowerCase();

    if (['m', 'male', '男', 'man', 'boy'].includes(lower)) return '男';
    if (['f', 'female', '女', 'woman', 'girl'].includes(lower)) return '女';

    // 其他文字，若已是「男 / 女」就直接顯示，否則「—」
    if (s === '男' || s === '女') return s;
    return '—';
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img && img.src !== this.FALLBACK_PHOTO) img.src = this.FALLBACK_PHOTO;
  }

  goEdit() { this.router.navigate(['/erp/employeelistedit', this.currentId]); }
  goList() { this.router.navigate(['/erp/employeelist']); }
}
