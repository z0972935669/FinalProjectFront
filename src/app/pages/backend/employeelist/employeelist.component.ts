// src/app/pages/backend/employeelist/employeelist.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeListService, Employee } from '../../../services/employee/employee-list.service';

// pipes
import { EmpStatusPipe } from '../../../pipes/employee/emp-status.pipe';
import { LookupDeptPipe } from '../../../pipes/employee/lookup-dept.pipe';
import { LookupTitlePipe } from '../../../pipes/employee/lookup-title.pipe';

/* ---------- 對照表：可先寫死，之後要改成 API 也可以 ---------- */
type Dept = { id: number; name: string };
type Title = { id: number; name: string; departmentId: number };

const DEPTS: Dept[] = [
  { id: 1, name: '照護部門' }, { id: 2, name: '營養部門' }, { id: 3, name: '總務部門' },
  { id: 4, name: '業務部門' }, { id: 5, name: '財務部門' }, { id: 6, name: '人資部門' },
  { id: 7, name: '資訊部門' },
];

const TITLES: Title[] = [
  { id: 1, name: '照護部長', departmentId: 1 }, { id: 2, name: '醫師', departmentId: 1 },
  { id: 3, name: '物理治療師', departmentId: 1 }, { id: 4, name: '復健師', departmentId: 1 },
  { id: 5, name: '護理長', departmentId: 1 }, { id: 6, name: '護理師', departmentId: 1 },
  { id: 7, name: '照服組長', departmentId: 1 }, { id: 8, name: '照服員', departmentId: 1 },
  { id: 9, name: '營養部長', departmentId: 2 }, { id: 10, name: '營養師', departmentId: 2 },
  { id: 11, name: '廚師長', departmentId: 2 }, { id: 12, name: '廚師', departmentId: 2 },
  { id: 13, name: '廚房助手', departmentId: 2 },
  { id: 14, name: '總務部長', departmentId: 3 }, { id: 15, name: '總務專員', departmentId: 3 },
  { id: 16, name: '設備工程師', departmentId: 3 },
  { id: 17, name: '業務部長', departmentId: 4 }, { id: 18, name: '業務專員', departmentId: 4 },
  { id: 19, name: '接待專員', departmentId: 4 },
  { id: 20, name: '財會部長', departmentId: 5 }, { id: 21, name: '財務專員', departmentId: 5 },
  { id: 22, name: '採購專員', departmentId: 5 },
  { id: 23, name: '人資部長', departmentId: 6 }, { id: 24, name: '人資專員', departmentId: 6 },
  { id: 25, name: '資訊科長', departmentId: 7 }, { id: 26, name: '資訊工程師', departmentId: 7 },
];

@Component({
  selector: 'app-employeelist',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, RouterModule, EmpStatusPipe, LookupDeptPipe, LookupTitlePipe],
  templateUrl: './employeelist.component.html',
  styleUrls: ['./employeelist.component.scss']
})
export class EmployeelistComponent implements OnInit {
  /* ------------ DI / 狀態 ------------ */
  private api = inject(EmployeeListService);

  loading = signal(false);
  error = signal<string | null>(null);
  employees = signal<Employee[]>([]);

  /* ------------ 篩選條件（全部都要放在 class 內） ------------ */
  deptSel = signal<number | 'all'>('all');
  titleSel = signal<number | 'all'>('all');
  keyword = signal<string>('');

  /* 下拉資料來源 */
  deptOptions = DEPTS;
  titleOptions = computed(() => {
    const d = this.deptSel();
    return d === 'all' ? TITLES : TITLES.filter(t => t.departmentId === d);
  });

  /* 內部名稱查詢（比對與顯示用） */
  private deptName(id?: number | null) { return DEPTS.find(d => d.id === Number(id))?.name ?? ''; }
  private titleName(id?: number | null) { return TITLES.find(t => t.id === Number(id))?.name ?? ''; }

  /* 過濾後的清單（表格用它顯示） */
  filteredEmployees = computed(() => {
    const list = this.employees();
    const kw = this.keyword().trim().toLowerCase();
    const dSel = this.deptSel();
    const tSel = this.titleSel();

    return list.filter(e => {
      if (dSel !== 'all' && Number(e.departmentId) !== dSel) return false;
      if (tSel !== 'all' && Number(e.jobTitleId) !== tSel) return false;

      if (!kw) return true;
      const name = (e.name ?? '').toLowerCase();
      const dept = this.deptName(e.departmentId).toLowerCase();
      const title = this.titleName(e.jobTitleId).toLowerCase();
      const statusText = e.employmentStatus ? '在職' : '離職';

      return name.includes(kw) || dept.includes(kw) || title.includes(kw) || statusText.includes(kw);
    });
  });

  /* 部門改變時，若原本選的職稱不屬於該部門則重置 */
  onDeptChange(value: number | 'all') {
    this.deptSel.set(value);
    const t = this.titleSel();
    if (value !== 'all' && t !== 'all') {
      const valid = TITLES.some(x => x.id === t && x.departmentId === value);
      if (!valid) this.titleSel.set('all');
    }
  }

  /* ------------ 載入資料 ------------ */
  ngOnInit(): void { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: list => { this.employees.set(list); this.loading.set(false); },
      error: err => { this.error.set(err?.message ?? '載入失敗'); this.loading.set(false); }
    });
  }
}
