import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'checkout'
})
export class CheckoutPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
