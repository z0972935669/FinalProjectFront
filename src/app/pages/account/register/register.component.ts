import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [FormsModule, RouterModule]
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  register() {
    if (this.password !== this.confirmPassword) {
      alert('密碼與確認密碼不一致');
      return;
    }

    console.log('註冊資料:', {
      name: this.name,
      email: this.email,
      password: this.password
    });

    // TODO: 可在此接後端 API
  }
}
