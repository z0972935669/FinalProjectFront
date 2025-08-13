import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class RegisterComponent {
  // 欄位
  account = '';
  password = '';
  confirmPassword = '';
  email = '';
  name = '';
  gender = '';
  phone = '';
  birthDate: string = '';
  photoFile?: File;
  photoPreview: string = '';


  showPassword = false;
  showConfirmPassword = false;

  constructor(private http: HttpClient, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onPhotoSelected(event: any) {
    this.photoFile = event.target.files[0];
    if (this.photoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(this.photoFile);
    }
  }

 register() {
    if (this.password !== this.confirmPassword) {
      alert(' 密碼與確認密碼不一致');
      return;
    }

    const formData = new FormData();
    formData.append('account', this.account);
    formData.append('password', this.password);
    formData.append('confirmPassword', this.confirmPassword);
    formData.append('email', this.email);
    formData.append('name', this.name);
    formData.append('gender', this.gender);
    formData.append('phone', this.phone);
    formData.append('birthDate', this.birthDate);
    if (this.photoFile) {
      formData.append('photo', this.photoFile);
    }


    this.http.post('https://localhost:7124/api/account/register', formData).subscribe({
          next: () => {
      alert('註冊成功，請重新登入');
      this.router.navigate(['/show/login']);
    },
      error: err => {
        console.error('註冊失敗:', err);
        alert(' 註冊失敗：' + (err.error || err.message || '請查看 Console'));
      }
    });
  }
}
