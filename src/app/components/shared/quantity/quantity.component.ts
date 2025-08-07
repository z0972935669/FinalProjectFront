import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quantity',
  imports: [FormsModule],
  templateUrl: './quantity.component.html',
  styleUrls: ['./quantity.component.scss'],
})
export class QuantityComponent {
  @Input() value: number = 1;
  @Output() valueChange = new EventEmitter<number>();

  increment() {
    this.value++;
    this.valueChange.emit(this.value);
  }

  decrement() {
    if (this.value > 1) {
      this.value--;
      this.valueChange.emit(this.value);
    }
  }

  onBlur() {
    let num = parseInt(this.value as any, 10);
    if (isNaN(num) || num < 1) {
      this.value = 1;
    } else {
      this.value = num;
    }
    this.valueChange.emit(this.value);
  }
}
