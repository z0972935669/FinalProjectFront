import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

declare let bootstrap: any;

@Component({
  selector: 'app-memberlist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './memberlist.component.html',
  styleUrls: ['./memberlist.component.scss']
})
export class MemberlistComponent implements OnInit {
  private readonly apiUrl = 'https://localhost:7124/api/backend/member';
  members: any[] = [];
  totalCount: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  selectedMember: any = null;
  isLoading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}?page=${this.currentPage}&pageSize=${this.pageSize}`)
      .subscribe({
        next: (res) => {
          this.members = res.members;
          this.totalCount = res.totalCount;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          console.error(' 讀取會員失敗', err);
          alert('載入會員列表失敗');
          this.isLoading = false;
        }
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMembers();
    }
  }

  editMember(member: any): void {
    this.http.get<any>(`${this.apiUrl}/${member.fMemberId}`)
      .subscribe({
        next: (res) => {
          console.log(' 載入會員資料:', res);
          this.selectedMember = {
            ...res,
            fBirthDate: res.fBirthDate
              ? new Date(res.fBirthDate).toISOString().split('T')[0]
              : null
          };

          const modalElement = document.getElementById('editMemberModal');
          if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        },
        error: (err) => {
          console.error(' 載入會員資料失敗', err);
          alert('載入會員資料失敗');
        }
      });
  }

  saveMember(): void {
    if (!this.selectedMember) return;

    const updateData = {
      fName: this.selectedMember.fName || '',
      fGender: this.selectedMember.fGender || '',
      fBirthDate: this.selectedMember.fBirthDate || null,
      fPhone: this.selectedMember.fPhone || '',
      fCity: this.selectedMember.fCity || '',
      fDistrict: this.selectedMember.fDistrict || '',
      fRoadAddress: this.selectedMember.fRoadAddress || '',
      fResidesInCareHomeStatus: this.selectedMember.fResidesInCareHomeStatus,
      fProfilePictureUrl: this.selectedMember.fProfilePictureUrl || ''
    };

    console.log(' 即將送出的更新資料:', updateData);

    this.http.put<any>(`${this.apiUrl}/${this.selectedMember.fMemberId}`, updateData)
      .subscribe({
        next: (res) => {
          console.log(' 更新成功:', res);
          this.http.get<any>(`${this.apiUrl}/${this.selectedMember.fMemberId}`)
            .subscribe({
              next: (freshData) => {
                const index = this.members.findIndex(m => m.fMemberId === freshData.fMemberId);
                if (index !== -1) {
                  this.members[index] = freshData;
                }
                alert(' 資料更新成功');
                this.closeModal();
              },
              error: (err) => {
                console.error(' 更新後重新抓取資料失敗', err);
                alert('已更新但無法重新載入會員資料');
              }
            });
        },
        error: (err) => {
          console.error(' 更新失敗:', err);
          alert('更新失敗：' + (err.error?.message || '請稍後再試'));
        }
      });
  }

  getImageUrl(filePath: string): string {
    if (!filePath) {
      return 'https://localhost:7124/images/members/default-avatar.png';
    }

    if (filePath.startsWith('images/members/')) {
      return `https://localhost:7124/${filePath}`;
    } else {
      return `https://localhost:7124/uploads/${filePath}`;
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.http.post<any>(`${this.apiUrl}/upload-profile-picture`, formData)
        .subscribe({
          next: (res) => {
            console.log(' 頭像上傳成功:', res);
            this.selectedMember.fProfilePictureUrl = res.url;
          },
          error: (err) => {
            console.error(' 頭像上傳失敗', err);
            alert('頭像上傳失敗');
          }
        });
    }
  }

  toggleAccountStatus(member: any): void {
    const memberId = member.fMemberId;
    this.http.patch<any>(`${this.apiUrl}/${memberId}/toggle-status`, {})
      .subscribe({
        next: (res) => {
          member.fAccountStatus = res.status;
          alert(`${member.fName} 的帳號狀態：${res.message}`);
        },
        error: (err) => {
          console.error(' 帳號狀態更新失敗', err);
          alert('更新失敗，請稍後再試');
        }
      });
  }

  closeModal(): void {
    this.selectedMember = null;
    const modalElement = document.getElementById('editMemberModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }
}
