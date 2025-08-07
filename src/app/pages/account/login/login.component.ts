import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  account = '';
  password = '';

  login() {
    console.log('帳號：', this.account);
    console.log('密碼：', this.password);
    // 可以在這裡呼叫 API 做驗證
  }
}
