import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
} from '@angular/common/http';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { EmergencyContact } from '../../../interfaces/member/emergency-contact.interface';
import { MemberService } from '../../../services/member/member.service';

interface HealthRecord {
  recordDate: string | Date;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  ioRecord?: string | null;
  checkPeriod?: string | null;
  notes?: string | null;
}

@Component({
  selector: 'app-member-info',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './member-info.component.html',
  styleUrls: ['./member-info.component.scss'],
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
    residesInCareHome: false,
  };

  contact: EmergencyContact = {
    fRelationship: '',
    fContactName: '',
    fPhone: '',
    fEmail: '',
    fCity: '',
    fDistrict: '',
    fAddress: '',
    fNotes: '',
    canEditContact: false,
  };

  isEdit = false;
  selectedPhoto: File | null = null;
  healthRecords: HealthRecord[] = [];
  private barChart?: Chart;
  private gaugeChart?: Chart;

  healthIcon = '';
  healthStatus = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    window.addEventListener('pageshow', (e: PageTransitionEvent) => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        this.router.navigate(['/show/login']);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (Date.now() > payload.exp * 1000) throw new Error('expired');
      } catch {
        localStorage.removeItem('jwtToken');
        this.router.navigate(['/show/login']);
      }
    });

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/show/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() > payload.exp * 1000) throw new Error('expired');
    } catch {
      localStorage.removeItem('jwtToken');
      this.router.navigate(['/show/login']);
      return;
    }

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
      photoUrl: 'https://localhost:7124/images/members/user.png',
      residesInCareHome: false,
    };
  }

  loadMemberData() {
    this.memberService.getMemberInfo().subscribe({
      next: (data) => {
        Object.assign(this.member, {
          username: data.name, // 根據你回傳的欄位名做對應
          name: data.name,
          email: data.email,
          // 若未來需要 phone、gender 等欄位，可補上
        });
      },
      error: () => {
        localStorage.removeItem('jwtToken');
        this.resetMember();
        this.router.navigate(['/show/login']);
      },
    });
  }

  toggleEdit() {
    this.isEdit = !this.isEdit;
  }

  save() {
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const formData = new FormData();
    formData.append('Name', this.member.name);
    formData.append('Email', this.member.email);
    formData.append('Phone', this.member.phone);
    formData.append('IdNumber', this.member.idnumber);
    formData.append('Gender', this.member.gender);
    if (this.member.birth) formData.append('BirthDate', this.member.birth);
    if (this.selectedPhoto) formData.append('Photo', this.selectedPhoto);

    this.http
      .put('https://localhost:7124/api/Member/update', formData, { headers })
      .subscribe({
        next: () => {
          alert('會員資料已更新');
          this.isEdit = false;
          this.loadMemberData();
        },
        error: () => {
          localStorage.removeItem('jwtToken');
          this.router.navigate(['/show/login']);
        },
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

  loadHealthRecords() {
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http
      .get<HealthRecord[]>(
        'https://localhost:7124/api/HealthRecord/my-records',
        { headers }
      )
      .subscribe({
        next: (data) => {
          const allData = (data ?? []).map((r) => ({
            ...r,
            recordDate:
              typeof r.recordDate === 'string'
                ? new Date(r.recordDate)
                : r.recordDate,
          }));

          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
          this.healthRecords = allData.filter(
            (r) => r.recordDate >= oneWeekAgo
          );

          if (this.healthRecords.length) {
            const latest = this.healthRecords[this.healthRecords.length - 1];
            this.renderGauge(this.calcHealthIndex(latest));
          }
          this.renderBarChart();
        },
        error: (err) => console.error('讀取健康紀錄失敗', err),
      });
  }

  private renderBarChart() {
    const canvas = document.getElementById(
      'healthBarChart'
    ) as HTMLCanvasElement;
    if (!canvas) return;
    if (this.barChart) this.barChart.destroy();

    const labels = this.healthRecords.map((r) =>
      r.recordDate instanceof Date
        ? r.recordDate.toISOString().slice(0, 10)
        : (r.recordDate as string)
    );
    const healthIndex = this.healthRecords.map((r) => this.calcHealthIndex(r));

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '健康指數',
            data: healthIndex,
            backgroundColor: healthIndex.map((v) =>
              v >= 80 ? '#4BC0C0' : v >= 60 ? '#FFD700' : '#FF6384'
            ),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100 } },
      },
    });
  }

  private renderGauge(value: number) {
    const canvas = document.getElementById('healthGauge') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.gaugeChart) this.gaugeChart.destroy();

    if (value >= 80) {
      this.healthIcon = 'fa-solid fa-face-grin-beam text-success';
      this.healthStatus = '狀態良好';
    } else if (value >= 60) {
      this.healthIcon = 'fa-solid fa-face-smile text-warning';
      this.healthStatus = '普通狀態';
    } else if (value >= 40) {
      this.healthIcon = 'fa-solid fa-face-frown-open text-orange';
      this.healthStatus = '需要小心';
    } else {
      this.healthIcon = 'fa-solid fa-face-dizzy text-danger';
      this.healthStatus = '安排就醫';
    }

    this.gaugeChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['健康度', '缺口'],
        datasets: [
          {
            data: [value, 100 - value],
            backgroundColor: ['#4BC0C0', '#E0E0E0'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
  }

  private calcHealthIndex(record: HealthRecord): number {
    let score = 100;
    if (record.systolic && (record.systolic < 110 || record.systolic > 130))
      score -= 10;
    if (record.diastolic && (record.diastolic < 70 || record.diastolic > 85))
      score -= 10;
    if (record.pulse && (record.pulse < 60 || record.pulse > 100)) score -= 10;
    return Math.max(score, 0);
  }

  loadEmergencyContact() {
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http
      .get<EmergencyContact>(
        'https://localhost:7124/api/MemberEmergencyContact/me',
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.contact = res;
        },
        error: () => {
          console.log('尚未有緊急聯絡人資料');
          this.contact = {
            fRelationship: '',
            fContactName: '',
            fPhone: '',
            fEmail: '',
            fCity: '',
            fDistrict: '',
            fAddress: '',
            fNotes: '',
            canEditContact: false,
          };
        },
      });
  }
}
