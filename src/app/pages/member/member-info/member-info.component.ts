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
    username: 'DAYE',
    name: '王大爺',
    email: 'wang********@gmail.com',
    phone: '09******43',
    idnumber: 'A12*****89',
    gender: '男',
    birth: '1966-10-10',
    photoPreview: 'assets/img/member/Older.jpg',
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
