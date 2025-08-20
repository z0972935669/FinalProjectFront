import { Pipe, PipeTransform } from '@angular/core';

const DEPT_MAP: Record<number, string> = {
  1: '照護部門',
  2: '營養部門',
  3: '總務部門',
  4: '業務部門',
  5: '財務部門',
  6: '人資部門',
  7: '資訊部門'
};

@Pipe({ name: 'deptName', standalone: true })
export class LookupDeptPipe implements PipeTransform {
  transform(deptId: number | null | undefined): string {
    if (deptId == null) return '';
    return DEPT_MAP[deptId] ?? `部門#${deptId}`;
  }
}
