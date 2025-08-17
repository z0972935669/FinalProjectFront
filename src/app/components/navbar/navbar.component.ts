import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(private router: Router, private http: HttpClient) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwtToken');
  }

  logout() {
    const token = localStorage.getItem('jwtToken');
    localStorage.removeItem('jwtToken'); // 先清除 token
    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
      this.http.post('https://localhost:7124/api/account/logout', {}, { headers })
        .subscribe({
          next: () => {
            // 使用 location.replace 防止回退記錄
            window.location.replace('/show/login');
            alert('已登出');
          },
          error: (err) => {
            console.error('登出失敗', err);
            window.location.replace('/show/login');
            alert('已登出');
          }
        });
    } else {
      window.location.replace('/show/login');
      alert('已登出');
    }
  }
}
