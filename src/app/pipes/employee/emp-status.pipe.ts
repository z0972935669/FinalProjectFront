import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'empStatus', standalone: true })
export class EmpStatusPipe implements PipeTransform {
  transform(status: boolean | null | undefined): string {
    return status ? '在職' : '離職';
  }
}
