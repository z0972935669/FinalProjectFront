import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-member-info',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './member-info.component.html',
  styleUrl: './member-info.component.scss',
})
export class MemberInfoComponent implements OnInit {
  member = {
    username: '',
    name: '',
    email: '',
    phone: '',
    idnumber: '',
    gender: '',
    birth: '',
    photoUrl: 'https://localhost:7124/images/members/default-avatar.png',
    residesInCareHome: false
  };

  isEdit = false;
  selectedPhoto: File | null = null;

  // 健康紀錄陣列
  healthRecords: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.resetMember();
    this.loadMemberData();
  }

  resetMember() {
    this.member = {
      username: '',
      name: '',
      email: '',
      phone: '',
      idnumber: '',
      gender: '',
      birth: '',
      photoUrl: '',
      residesInCareHome: false
    };
  }

  loadMemberData() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('未登入');
      this.router.navigate(['/show/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      if (Date.now() > expiry) {
        console.error('Token 已過期');
        localStorage.removeItem('jwtToken');
        this.router.navigate(['/show/login']);
        return;
      }
    } catch (e) {
      console.error('Token 解析失敗', e);
      localStorage.removeItem('jwtToken');
      this.router.navigate(['/show/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>('https://localhost:7124/api/Member/me', { headers })
      .subscribe({
        next: (data) => {
          this.member.username = data.username;
          this.member.name = data.name;
          this.member.email = data.email;
          this.member.phone = data.phone;
          this.member.idnumber = data.idNumber;
          this.member.gender = data.gender;
          this.member.birth = data.birthDate;
          this.member.photoUrl = data.photoUrl;
          this.member.residesInCareHome = data.residesInCareHome;
        },
        error: (err) => {
          console.error('取得會員資料失敗', err);
          localStorage.removeItem('jwtToken');
          this.resetMember();
          this.router.navigate(['/show/login']);
        }
      });
  }

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  save() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/show/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('Name', this.member.name);
    formData.append('Email', this.member.email);
    formData.append('Phone', this.member.phone);
    formData.append('IdNumber', this.member.idnumber);
    formData.append('Gender', this.member.gender);
    if (this.member.birth) {
      formData.append('BirthDate', this.member.birth);
    }
    if (this.selectedPhoto) {
      formData.append('Photo', this.selectedPhoto);
    }

    this.http.put('https://localhost:7124/api/Member/update', formData, { headers })
      .subscribe({
        next: () => {
          alert('會員資料已更新');
          this.isEdit = false;
          this.loadMemberData();
        },
        error: (err) => {
          console.error('更新失敗', err);
          localStorage.removeItem('jwtToken');
          this.router.navigate(['/show/login']);
        }
      });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.member.photoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ 取得每日健康紀錄
  loadHealthRecords() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any[]>('https://localhost:7124/api/HealthRecord/my-records', { headers })
      .subscribe({
        next: (data) => {
          this.healthRecords = data;
          this.renderChart();
        },
        error: (err) => {
          console.error('讀取健康紀錄失敗', err);
        }
      });
  }

  // ✅ 繪製 Chart.js 折線圖
  renderChart() {
    const ctx = document.getElementById('healthChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.healthRecords.map(r => r.recordDate);
    const systolic = this.healthRecords.map(r => r.systolic);
    const diastolic = this.healthRecords.map(r => r.diastolic);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '收縮壓',
            data: systolic,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.3,
            fill: false
          },
          {
            label: '舒張壓',
            data: diastolic,
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }
}
