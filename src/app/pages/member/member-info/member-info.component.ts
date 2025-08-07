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
    idnumber: 'A123456789',
    gender: '男',
    birth: '1997-10-10',
    photoPreview: '',
  };

  isEdit = false;

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  save() {
    this.isEdit = false;
    alert('資料已儲存！');
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.member.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}
