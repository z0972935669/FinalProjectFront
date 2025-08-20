import { Pipe, PipeTransform } from '@angular/core';

const TITLE_MAP: Record<number, string> = {
  1: '照護部長',
  2: '醫師',
  3: '物理治療師',
  4: '復健師',
  5: '護理長',
  6: '護理師',
  7: '照服組長',
  8: '照服員',
  9: '營養部長',
  10: '營養師',
  11: '廚師長',
  12: '廚師',
  13: '廚房助手',
  14: '總務部長',
  15: '總務專員',
  16: '設備工程師',
  17: '業務部長',
  18: '業務專員',
  19: '接待專員',
  20: '財會部長',
  21: '財務專員',
  22: '採購專員',
  23: '人資部長',
  24: '人資專員',
  25: '資訊科長',
  26: '資訊工程師'
};

@Pipe({ name: 'titleName', standalone: true })
export class LookupTitlePipe implements PipeTransform {
  transform(jobTitleId: number | null | undefined): string {
    if (jobTitleId == null) return '';
    return TITLE_MAP[jobTitleId] ?? `職稱#${jobTitleId}`;
  }
}
