// src/app/pages/backend/employeelistedit/employeelistedit.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { EmployeeAuthService } from '../../../services/employee/employee-auth.service';
import { EmployeeDetailDto } from '../../../models/employee-detail.dto';

type Dept = { id: number; name: string };
type Job = { id: number; name: string; deptId?: number };

@Component({
  selector: 'app-employeelistedit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employeelistedit.component.html',
  styleUrls: ['./employeelistedit.component.scss'],
})
export class EmployeelisteditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(EmployeeAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = true;
  saving = false;
  error: string | null = null;

  /** 完整初始化完成後才開放「儲存」按鈕 */
  formReady = false;

  /** 本次要編輯的 EmployeeId（模板/導頁會用） */
  id!: number;
  vm!: EmployeeDetailDto;
  private editingOthers = false; // 是否是透過 :id 編輯別人

  /** 後端預設頭像（依你的後端靜態路徑調整） */
  private readonly FALLBACK_PHOTO = 'https://localhost:7124/images/employees/noimage.jpg';

  // 頭像
  photoFile: File | null = null;
  previewUrl = this.FALLBACK_PHOTO;

  // 下拉選項
  educationOptions = ['博士', '碩士', '大學', '高中', '高職', '五專', '四技', '二技', '專科', '國中', '國小', '無'];
  relationshipOptions = ['配偶', '父母', '子女', '兄弟', '姊妹', '祖父母', '孫子女', '親戚', '朋友'];
  heightOptions = Array.from({ length: 151 }, (_, i) => i + 100); // 100~250
  weightOptions = Array.from({ length: 171 }, (_, i) => i + 30);  // 30~200

  // 部門/職稱
  departments: Dept[] = [];
  jobs: Job[] = [];
  jobsLoading = false;

  // Reactive Form
  form = this.fb.group({
    // 基本資料
    Name: ['', [Validators.required, Validators.maxLength(100)]],
    Gender: [''],
    IdentityNumber: ['', [Validators.required, Validators.maxLength(20)]],
    BirthDate: <string | null>null,
    Phone: ['', [Validators.maxLength(20)]],
    Email: ['', [Validators.email, Validators.maxLength(100)]],
    EducationLevel: ['', [Validators.maxLength(100)]],
    RegisteredAddress: ['', [Validators.maxLength(100)]],
    SameAsRegistered: [false],
    CurrentAddress: ['', [Validators.maxLength(100)]],
    Height: <number | null>160,
    Weight: <number | null>50,
    PayrollBankAccount: ['', [Validators.maxLength(100)]],

    // 職務
    EmploymentStatusText: [''],
    DepartmentId: <number | null>null,
    DepartmentName: [''],
    JobTitleId: <number | null>null,
    JobTitleName: [''],
    HireDate: <string | null>null,

    // 布林
    PoliceClearanceCertified: <boolean | null>false,
    IsSupervisor: <boolean | null>false,
    IsAdmin: <boolean | null>false,

    // 緊急聯絡人
    EmergencyContactPerson: [''],
    EmergencyContactPhone: [''],
    EmergencyContactRelationship: [''],
  });

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async pm => {
      this.loading = true;
      this.error = null;
      this.formReady = false;

      const paramId = pm.get('id');

      // ✅ 先從快取拿自己的 id；沒有就 call /me
      let myId = this.auth.getEmployeeIdCached() ?? 0;
      if (!myId) {
        try {
          const me = await firstValueFrom(this.auth.fetchMe()); // { id, name }
          myId = me?.id ?? 0;
        } catch {
          myId = 0;
        }
      }

      this.editingOthers = !!paramId;
      this.id = Number(paramId ?? myId);

      if (!this.id || Number.isNaN(this.id)) {
        this.router.navigate(['/erp/login'], {
          queryParams: { returnUrl: paramId ? `/erp/employeelistedit/${paramId}` : '/erp/employeelistedit' }
        });
        return;
      }

      try {
        // 1) 讀取詳情
        const dto = await firstValueFrom(this.auth.getEmployeeDetail(this.id));
        this.vm = dto;
        this.patchEmployeeToForm(dto);

        // 同戶籍地址勾選
        this.form.get('SameAsRegistered')!.valueChanges.subscribe((checked) => {
          const reg = this.form.get('RegisteredAddress')!.value ?? '';
          const currentCtrl = this.form.get('CurrentAddress')!;
          if (checked) { currentCtrl.setValue(reg); currentCtrl.disable({ emitEvent: false }); }
          else { currentCtrl.enable({ emitEvent: false }); }
        });

        // 2) 部門清單
        this.departments = await firstValueFrom(
          this.auth.getDepartments().pipe(catchError(() => of<Dept[]>([])))
        );

        // 先把職稱下拉關閉，等有資料再開
        const jobCtrl = this.form.get('JobTitleId')!;
        jobCtrl.disable({ emitEvent: false });

        // 部門變更 → 載入職稱
        this.form.get('DepartmentId')!.valueChanges.subscribe(async (deptIdRaw) => {
          const deptId = deptIdRaw != null ? Number(deptIdRaw) : null; // ← 強制 number
          jobCtrl.reset(null, { emitEvent: false });
          jobCtrl.disable({ emitEvent: false });
          this.jobs = [];

          if (deptId != null && !Number.isNaN(deptId)) {
            await this.loadJobsByDept(deptId);
            if (this.jobs.length) jobCtrl.enable({ emitEvent: false });

            // 依名稱對回職稱ID（若原本只有名稱）
            const jtName = this.form.get('JobTitleName')?.value;
            const found = this.jobs.find(j => j.name === jtName);
            if (found) jobCtrl.setValue(found.id, { emitEvent: false });
          }
        });

        // 3) 依舊資料對回部門/職稱
        await this.initDeptAndJobFromDto(dto);

        this.formReady = true;
      } catch (e: any) {
        console.error(e);
        this.error = e?.message ?? '載入失敗';
      } finally {
        this.loading = false;
      }
    });
  }

  /** 依部門載入職稱（失敗回空陣列） */
  private async loadJobsByDept(deptId: number) {
    this.jobsLoading = true;
    try {
      this.jobs = await firstValueFrom(
        this.auth.getJobsByDepartment(deptId).pipe(catchError(() => of<Job[]>([])))
      );
    } finally {
      this.jobsLoading = false;
    }
  }

  /** 初始對回 DepartmentId/JobTitleId（優先 ID，否則用名稱比對） */
  private async initDeptAndJobFromDto(dto: EmployeeDetailDto) {
    // 部門
    let deptId = (dto as any)?.DepartmentId != null ? Number((dto as any).DepartmentId) : null;
    if (deptId == null && (dto as any)?.DepartmentName) {
      const hit = this.departments.find(d => d.name === (dto as any).DepartmentName);
      deptId = hit?.id ?? null;
    }
    if (deptId != null) {
      this.form.get('DepartmentId')!.setValue(deptId, { emitEvent: true });
      await this.loadJobsByDept(deptId);
      // 有資料才啟用職稱下拉
      if (this.jobs.length) this.form.get('JobTitleId')!.enable({ emitEvent: false });
    }

    // 職稱
    let jobId = (dto as any)?.JobTitleId != null ? Number((dto as any).JobTitleId) : null;
    if (jobId == null && (dto as any)?.JobTitleName && this.jobs.length) {
      const hit = this.jobs.find(j => j.name === (dto as any).JobTitleName);
      jobId = hit?.id ?? null;
    }
    if (jobId != null) {
      this.form.get('JobTitleId')!.setValue(jobId, { emitEvent: false });
    }
  }

  /** 把後端資料 patch 進表單（含日期與預設值處理） */
  private patchEmployeeToForm(dto: EmployeeDetailDto) {
    const birth = this.toDateInputValue(dto?.BirthDate);
    const hire = this.toDateInputValue(dto?.HireDate) || this.toDateInputValue(new Date());

    // 頭像預覽
    this.previewUrl = dto?.PhotoPath?.trim() ? dto.PhotoPath : this.FALLBACK_PHOTO;

    const safeNum = (v: any, def: number, min: number, max: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min && n <= max ? n : def;
    };

    this.form.patchValue({
      Name: dto?.Name ?? '',
      Gender: (dto as any)?.Gender ?? (dto as any)?.GenderText ?? '',
      IdentityNumber: dto?.IdentityNumber ?? '',
      BirthDate: birth,
      Phone: dto?.Phone ?? '',
      Email: dto?.Email ?? '',
      EducationLevel: dto?.EducationLevel ?? '大學',
      RegisteredAddress: dto?.RegisteredAddress ?? '',
      SameAsRegistered: false,
      CurrentAddress: dto?.CurrentAddress ?? '',
      Height: safeNum(dto?.Height, 160, 100, 250),
      Weight: safeNum(dto?.Weight, 50, 30, 200),
      PayrollBankAccount: dto?.PayrollBankAccount ?? '',

      EmploymentStatusText: dto?.EmploymentStatusText ?? '',

      // ← 這裡也把 Id 轉 number
      DepartmentId: (dto as any)?.DepartmentId != null ? Number((dto as any).DepartmentId) : null,
      DepartmentName: (dto as any)?.DepartmentName ?? '',
      JobTitleId: (dto as any)?.JobTitleId != null ? Number((dto as any).JobTitleId) : null,
      JobTitleName: (dto as any)?.JobTitleName ?? '',

      HireDate: hire,

      PoliceClearanceCertified: !!dto?.PoliceClearanceCertified,
      IsSupervisor: !!dto?.IsSupervisor,
      IsAdmin: !!dto?.IsAdmin,

      EmergencyContactPerson: dto?.EmergencyContactPerson ?? '',
      EmergencyContactPhone: dto?.EmergencyContactPhone ?? '',
      EmergencyContactRelationship: dto?.EmergencyContactRelationship ?? this.relationshipOptions[0],
    }, { emitEvent: false });
  }

  /** yyyy-MM-dd 字串（給 <input type="date">） */
  private toDateInputValue(d: string | Date | null | undefined): string {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private inList<T>(v: T | null | undefined, list: T[]) { return v != null && list.includes(v as T); }

  /** 單選（是/否）手動設布林值 */
  setBool(ctrlName: string, v: boolean) { this.form.get(ctrlName)?.setValue(v); }

  /** 大頭照預覽 */
  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.photoFile = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = String(reader.result));
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = this.FALLBACK_PHOTO;
    }
  }

  /** 儲存 */
  save() {
    if (!this.id || !this.formReady || this.form.invalid) return;
    this.saving = true;

    const payload = { ...this.form.getRawValue() } as any;
    if (payload.SameAsRegistered) {
      payload.CurrentAddress = payload.RegisteredAddress ?? '';
    }

    // 若後端仍吃名稱，這裡用 ID 反查以免遺失
    const dept = this.departments.find(d => d.id === payload.DepartmentId);
    if (dept) payload.DepartmentName = dept.name;
    const job = this.jobs.find(j => j.id === payload.JobTitleId);
    if (job) payload.JobTitleName = job.name;

    this.auth.updateEmployeeDetail(this.id, payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          const upload$ = this.photoFile ? this.auth.uploadEmployeePhoto(this.id, this.photoFile) : null;
          if (upload$) {
            upload$.subscribe({
              next: () => this.afterSave(),
              error: (err) => this.afterSave(err),
            });
          } else {
            this.afterSave();
          }
        },
        error: (err) => this.afterSave(err),
      });
  }

  private afterSave(err?: any) {
    if (err) {
      alert(`儲存失敗：${err?.message ?? err}`);
      return;
    }
    alert('儲存成功');
    // ✅ 明確帶 id 回詳細頁，避免丟失目標
    this.router.navigate(['/erp/employeelistdetail', this.id]);
  }

  /** 取消/返回詳細資料（供模板綁定） */
  goDetail() {
    this.router.navigate(['/erp/employeelistdetail', this.id]);
  }

  /** 頭像載入錯誤 → 顯示 fallback 圖 */
  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = this.FALLBACK_PHOTO;
  }
}
