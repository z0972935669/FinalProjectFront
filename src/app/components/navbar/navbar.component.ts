// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  memberName: string | null = null;  // 儲存會員姓名

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadMemberName();
    }
        this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isLoggedIn()) this.loadMemberName();
        else this.memberName = null;
      });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwtToken');
  }

  private loadMemberName() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>('https://localhost:7124/api/Member/me', { headers })
      .subscribe({
        next: (res) => {
          this.memberName = res.name;  // 後端回傳的 FName
        },
        error: () => {
          // token 無效就清掉，導回登入
          localStorage.removeItem('jwtToken');
          this.router.navigate(['/show/login']);
        }
      });
  }

  logout() {
    const token = localStorage.getItem('jwtToken');
    localStorage.removeItem('jwtToken');
    if (token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.post('https://localhost:7124/api/account/logout', {}, { headers })
        .subscribe({
          next: () => {
            window.location.replace('/show/login');
          },
          error: () => {
            window.location.replace('/show/login');
          }
        });
    } else {
      window.location.replace('/show/login');
    }
  }
}
