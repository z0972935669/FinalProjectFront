import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-member-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-info.component.html',
  styleUrl: './member-info.component.scss',
})
export class MemberInfoComponent {
  member = {
    username: 'Dantni',
    name: '謝維澤',
    email: 'xie********@gmail.com',
    phone: '09******43',
    gender: '男',
    birth: '1997-10-10',
  };

  isEdit = false;

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  save() {
    this.isEdit = false;
    alert('資料已儲存！（模擬）');
  }
}
