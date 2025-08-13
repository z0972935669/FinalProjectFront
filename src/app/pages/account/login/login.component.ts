import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  account = '';
  password = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const loginData = {
      account: this.account,
      password: this.password
    };

    this.http.post('https://localhost:7124/api/account/login', loginData)
      .subscribe({
        next: (res: any) => {
          console.log('登入成功', res);
          localStorage.setItem('jwtToken', res.token);
          this.router.navigate(['/member-info']);
        },
        error: (err) => {
          console.error('登入失敗', err);
          alert('帳號或密碼錯誤');
        }
      });
  }

  loginWithGoogle() {
    window.location.href = 'https://localhost:7124/api/account/google-login';
  }

  logout() {
    localStorage.removeItem('jwtToken');
    this.router.navigate(['/login']);
    alert('已登出');
  }
}
