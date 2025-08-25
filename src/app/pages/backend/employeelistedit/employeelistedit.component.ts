// src/app/pages/backend/employeelistedit/employeelistedit.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  loading = true;
  saving = false;
  error: string | null = null;

  /** 完整初始化（含清單對齊）完成後才開放「儲存」按鈕 */
  formReady = false;

  id!: number;
  vm!: EmployeeDetailDto;

  // 頭像
  photoFile: File | null = null;
  previewUrl = 'assets/backend/images/users/noimage.jpg';

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
    DepartmentId: <number | null>null,  // 用 ID 做資料寫回
    DepartmentName: [''],               // 僅顯示
    JobTitleId: <number | null>null,
    JobTitleName: [''],
    HireDate: <string | null>null,

    // 布林欄位
    PoliceClearanceCertified: <boolean | null>false,
    IsSupervisor: <boolean | null>false,
    IsAdmin: <boolean | null>false,

    // 緊急聯絡人
    EmergencyContactPerson: [''],
    EmergencyContactPhone: [''],
    EmergencyContactRelationship: [''],
  });

  async ngOnInit(): Promise<void> {
    this.id = this.auth.getEmployeeIdFromToken() ?? 0;
    if (!this.id) {
      this.router.navigate(['/erp/login'], { queryParams: { returnUrl: '/erp/employeelistedit' } });
      return;
    }

    try {
      // 1) 先載入個人資料（不被清單 API 影響）
      const dto = await firstValueFrom(this.auth.getEmployeeDetail(this.id));
      this.vm = dto;
      this.patchEmployeeToForm(dto);

      // 「同戶籍地址」：勾選時帶入並 disable；取消保留並 enable
      this.form.get('SameAsRegistered')!.valueChanges.subscribe((checked) => {
        const reg = this.form.get('RegisteredAddress')!.value ?? '';
        const currentCtrl = this.form.get('CurrentAddress')!;
        if (checked) { currentCtrl.setValue(reg); currentCtrl.disable({ emitEvent: false }); }
        else { currentCtrl.enable({ emitEvent: false }); }
      });

      // 2) 再載入部門清單（就算失敗也不影響畫面）
      this.departments = await firstValueFrom(
        this.auth.getDepartments().pipe(catchError(() => of<Dept[]>([])))
      );

      // 部門變更 → 載入職稱
      this.form.get('DepartmentId')!.valueChanges.subscribe(async (deptId) => {
        this.form.get('JobTitleId')!.reset(null, { emitEvent: false });
        this.jobs = [];
        if (deptId != null) {
          await this.loadJobsByDept(deptId);
          // 若原本有職稱名稱，幫忙對回 ID
          const jtName = this.form.get('JobTitleName')?.value;
          const found = this.jobs.find(j => j.name === jtName);
          if (found) this.form.get('JobTitleId')!.setValue(found.id, { emitEvent: false });
        }
      });

      // 3) 把舊的部門/職稱對回（若有）
      await this.initDeptAndJobFromDto(dto);

      this.formReady = true;
    } catch (e: any) {
      console.error(e);
      this.error = e?.message ?? '載入失敗';
    } finally {
      this.loading = false;
    }
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
    let deptId = (dto as any)?.DepartmentId ?? null;
    if (deptId == null && (dto as any)?.DepartmentName) {
      const hit = this.departments.find(d => d.name === (dto as any).DepartmentName);
      deptId = hit?.id ?? null;
    }
    if (deptId != null) {
      this.form.get('DepartmentId')!.setValue(deptId, { emitEvent: true });
      await this.loadJobsByDept(deptId);
    }

    // 職稱
    let jobId = (dto as any)?.JobTitleId ?? null;
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

    this.previewUrl = dto?.PhotoPath && dto.PhotoPath.trim()
      ? dto.PhotoPath
      : 'assets/backend/images/users/noimage.jpg';

    const safeNum = (v: any, def: number, min: number, max: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min && n <= max ? n : def;
    };

    this.form.patchValue({
      Name: dto?.Name ?? '',
      IdentityNumber: dto?.IdentityNumber ?? '',
      BirthDate: birth,
      Phone: dto?.Phone ?? '',
      Email: dto?.Email ?? '',
      EducationLevel: this.inList(dto?.EducationLevel, this.educationOptions) ? dto!.EducationLevel! : '大學',
      RegisteredAddress: dto?.RegisteredAddress ?? '',
      SameAsRegistered: false,
      CurrentAddress: dto?.CurrentAddress ?? '',
      Height: safeNum(dto?.Height, 160, 100, 250),
      Weight: safeNum(dto?.Weight, 50, 30, 200),
      PayrollBankAccount: dto?.PayrollBankAccount ?? '',

      EmploymentStatusText: dto?.EmploymentStatusText ?? '',

      DepartmentId: (dto as any)?.DepartmentId ?? null,
      DepartmentName: (dto as any)?.DepartmentName ?? '',
      JobTitleId: (dto as any)?.JobTitleId ?? null,
      JobTitleName: (dto as any)?.JobTitleName ?? '',

      HireDate: hire,

      PoliceClearanceCertified: !!dto?.PoliceClearanceCertified,
      IsSupervisor: !!dto?.IsSupervisor,
      IsAdmin: !!dto?.IsAdmin,

      EmergencyContactPerson: dto?.EmergencyContactPerson ?? '',
      EmergencyContactPhone: dto?.EmergencyContactPhone ?? '',
      EmergencyContactRelationship: this.inList(dto?.EmergencyContactRelationship, this.relationshipOptions)
        ? dto!.EmergencyContactRelationship! : this.relationshipOptions[0],
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
  private inList<T>(v: T | null | undefined, list: T[]) { return v != null && list.includes(v); }

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
      this.previewUrl = 'assets/backend/images/users/noimage.jpg';
    }
  }

  /** 儲存 */
  save() {
    if (!this.id || !this.formReady || this.form.invalid) return;
    this.saving = true;

    const payload = { ...this.form.getRawValue() };
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
    this.router.navigate(['/erp/employeelistdetail']);
  }
}
