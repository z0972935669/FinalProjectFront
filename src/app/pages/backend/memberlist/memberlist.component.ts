import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

declare let bootstrap: any;

interface Member {
  fMemberId: number;
  fName: string;
  fBirthDate?: string | null;
  fResidesInCareHomeStatus: boolean;
  fAccountStatus: boolean;
  fProfilePictureUrl?: string | null;
  fGender?: string | null;
  fPhone?: string | null;
  fCity?: string | null;
  fDistrict?: string | null;
  fRoadAddress?: string | null;
}

interface HealthRecordPayload {
  recordDate: string;            // yyyy-MM-dd
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  ioRecord: string;
  checkPeriod: string;
  notes: string;
}

@Component({
  selector: 'app-memberlist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './memberlist.component.html',
  styleUrls: ['./memberlist.component.scss']
})
export class MemberlistComponent implements OnInit {

  /** API 位址 */
  private readonly apiUrl = 'https://localhost:7124/api/backend/member';
  private readonly healthApi = 'https://localhost:7124/api/backend/health-record';

  /** 列表資料與分頁 */
  members: Member[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  isLoading = false;

  /** 編輯會員 */
  selectedMember: Member | null = null;

  /** 新增健康紀錄（卡片） */
  selectedHealthMember: Member | null = null;
  showHealthForm = false;
  healthRecord: HealthRecordPayload = {
    recordDate: this.todayString(),
    systolic: null,
    diastolic: null,
    pulse: null,
    ioRecord: '',
    checkPeriod: '',
    notes: ''
  };

  /** 檢視健康紀錄（Modal） */
  healthListMember: Member | null = null;
  healthList: any[] = [];
  isHealthListLoading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  /** Auth 標頭 */
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('jwtToken') ?? '';
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  /** 今天 yyyy-MM-dd */
  private todayString(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  /** 讀取會員 */
  loadMembers(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}?page=${this.currentPage}&pageSize=${this.pageSize}`, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          this.members = res.members ?? [];
          this.totalCount = res.totalCount ?? 0;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('讀取會員失敗', err);
          alert('載入會員列表失敗');
          this.isLoading = false;
        }
      });
  }

  /** 換頁 */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMembers();
    }
  }

  /** 開啟編輯會員 Modal */
  editMember(member: Member): void {
    this.http.get<Member>(`${this.apiUrl}/${member.fMemberId}`, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          this.selectedMember = {
            ...res,
            fBirthDate: res.fBirthDate ? new Date(res.fBirthDate).toISOString().split('T')[0] : null
          };
          const el = document.getElementById('editMemberModal');
          if (!el) return;
          const modal = bootstrap.Modal.getOrCreateInstance(el);
          modal.show();
        },
        error: (err) => {
          console.error('載入會員資料失敗', err);
          alert('載入會員資料失敗');
        }
      });
  }

  /** 儲存會員 */
  saveMember(): void {
    if (!this.selectedMember) return;

    const id = this.selectedMember.fMemberId;
    const updateData = {
      fName: this.selectedMember.fName ?? '',
      fGender: this.selectedMember.fGender ?? '',
      fBirthDate: this.selectedMember.fBirthDate ?? null,
      fPhone: this.selectedMember.fPhone ?? '',
      fCity: this.selectedMember.fCity ?? '',
      fDistrict: this.selectedMember.fDistrict ?? '',
      fRoadAddress: this.selectedMember.fRoadAddress ?? '',
      fResidesInCareHomeStatus: this.selectedMember.fResidesInCareHomeStatus,
      fProfilePictureUrl: this.selectedMember.fProfilePictureUrl ?? ''
    };

    this.http.put<any>(`${this.apiUrl}/${id}`, updateData, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.http.get<Member>(`${this.apiUrl}/${id}`, this.getAuthHeaders())
            .subscribe({
              next: (fresh) => {
                const idx = this.members.findIndex(m => m.fMemberId === fresh.fMemberId);
                if (idx !== -1) this.members[idx] = fresh;
                alert('資料更新成功');
                this.closeModal();
              },
              error: (e) => {
                console.error('更新後重新抓取資料失敗', e);
                alert('已更新但無法重新載入會員資料');
              }
            });
        },
        error: (err) => {
          console.error('更新失敗:', err);
          alert('更新失敗：' + (err.error?.message ?? '請稍後再試'));
        }
      });
  }

  /** 上傳頭像 */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedMember) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`${this.apiUrl}/upload-profile-picture`, formData, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          this.selectedMember!.fProfilePictureUrl = res.url;
        },
        error: (err) => {
          console.error('頭像上傳失敗', err);
          alert('頭像上傳失敗');
        }
      });
  }

  /** 啟用/停權 */
  toggleAccountStatus(member: Member): void {
    const memberId = member.fMemberId;
    this.http.patch<any>(`${this.apiUrl}/${memberId}/toggle-status`, {}, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          member.fAccountStatus = !!res.status;
          alert(`${member.fName} 的帳號狀態：${res.message ?? (member.fAccountStatus ? '啟用' : '停權')}`);
        },
        error: (err) => {
          console.error('帳號狀態更新失敗', err);
          alert('更新失敗，請稍後再試');
        }
      });
  }

  /** 關閉編輯 Modal */
  closeModal(): void {
    this.selectedMember = null;
    const el = document.getElementById('editMemberModal');
    if (!el) return;
    const modal = bootstrap.Modal.getInstance(el) ?? bootstrap.Modal.getOrCreateInstance(el);
    modal.hide();
  }

  /** 開啟新增表單卡片（僅入住者會看到按鈕） */
  openHealthModal(member: Member): void {
    this.selectedHealthMember = member;
    this.showHealthForm = true;
    this.healthRecord = {
      recordDate: this.todayString(),
      systolic: null,
      diastolic: null,
      pulse: null,
      ioRecord: '',
      checkPeriod: '',
      notes: ''
    };
  }

  /** 關閉新增表單卡片 */
  cancelHealthRecord(): void {
    this.showHealthForm = false;
    this.selectedHealthMember = null;
  }

  /** 送出健康紀錄（你後端收 querystring 的 memberId） */
  submitHealthRecord(): void {
    if (!this.selectedHealthMember) return;

    const url = `${this.healthApi}?memberId=${this.selectedHealthMember.fMemberId}`;
    const payload = { ...this.healthRecord };

    this.http.post<any>(url, payload, this.getAuthHeaders()).subscribe({
      next: () => {
        alert('健康紀錄新增成功');
        this.showHealthForm = false;
        this.selectedHealthMember = null;
      },
      error: (err) => {
        console.error('健康紀錄新增失敗', err);
        alert('健康紀錄新增失敗：' + (err?.error?.message ?? '請稍後再試'));
      }
    });
  }

  /** 檢視近 7 天健康紀錄（Bootstrap Modal） */
  openHealthList(member: Member): void {
    if (!member.fResidesInCareHomeStatus) {
      alert('僅限已入住會員可檢視健康紀錄');
      return;
    }
    this.healthListMember = member;
    this.isHealthListLoading = true;

    this.http.get<any[]>(`${this.healthApi}/by-member/${member.fMemberId}`, this.getAuthHeaders())
      .subscribe({
        next: (rows) => {
          console.log('健康紀錄 rows:', rows);
          this.healthList = rows ?? [];
          this.isHealthListLoading = false;

          const el = document.getElementById('healthListModal');
          if (!el) return;
          const modal = bootstrap.Modal.getOrCreateInstance(el);
          modal.show();
        },
        error: (err) => {
          console.error('載入健康紀錄失敗', err);
          alert('載入健康紀錄失敗');
          this.isHealthListLoading = false;
        }
      });
  }

  /** 儲存單筆（行內編輯） */
saveRecord(r: any): void {
  console.log('要更新的紀錄 r:', r);
  if (!r.id) {
    alert('缺少紀錄 ID，無法更新');
    return;
  }

  const payload = {
    recordDate: r.recordDate,
    systolic: r.systolic,
    diastolic: r.diastolic,
    pulse: r.pulse,
    ioRecord: r.ioRecord,
    checkPeriod: r.checkPeriod,
    notes: r.notes
  };

  this.http.put(`${this.healthApi}/${r.id}`, payload, this.getAuthHeaders())
    .subscribe({
      next: () => {
        r._edit = false;
        alert('已更新');
      },
      error: (e) => {
        console.error(e);
        alert('更新失敗');
      }
    });
}



  /** 刪除單筆 */
  deleteRecord(id: number): void {
    if (!confirm('確定刪除這筆紀錄？')) return;

    this.http.delete(`${this.healthApi}/${id}`, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.healthList = this.healthList.filter(x => x.id !== id);
          alert('已刪除');
        },
        error: (e) => { console.error(e); alert('刪除失敗'); }
      });
  }

  /** 頭像網址處理（更嚴謹） */
  getImageUrl(filePath?: string | null): string {
    const base = 'https://localhost:7124';
    if (!filePath) return `${base}/images/members/default-avatar.png`;

    const p = (filePath || '').replace(/^\//, '');
    if (p.startsWith('http')) return p;
    if (p.startsWith('images/') || p.startsWith('uploads/')) return `${base}/${p}`;
    return `${base}/images/members/${p}`;
  }
}
