import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CityService, CityMap } from '../../../services/city/city.service';
import { take } from 'rxjs/operators';

// Bootstrap 5.0 只有全域物件與 getInstance，沒有 getOrCreateInstance
declare const bootstrap: any;

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
  recordDate: string; // yyyy-MM-dd
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

  // 城市資料
  cityMap: CityMap = {};
  cityOptions: string[] = [];
  districtOptions: string[] = [];

  /** 編輯會員 */
  selectedMember: Member | null = null;

  /** 新增健康紀錄（Modal） */
  selectedHealthMember: Member | null = null;
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

  constructor(
    private http: HttpClient,
    private citySvc: CityService
  ) {}

  ngOnInit(): void {
    this.loadMembers();

    // 預先載入一次城市對照（CityService 內有 shareReplay，不會重複打）
    this.citySvc.getCityMap().pipe(take(1)).subscribe({
      next: (map) => {
        this.cityMap = map;
        this.cityOptions = Object.keys(map);
      },
      error: () => console.error('載入縣市資料失敗')
    });
  }

  /** ===== 工具：Auth 標頭 ===== */
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('jwtToken') ?? '';
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  /** ===== 工具：今天 yyyy-MM-dd ===== */
  private todayString(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  /** ===== 工具：保證拿到一個 Modal instance（5.0 相容寫法）===== */
  private ensureModal(el: HTMLElement) {
    return bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
  }

  /** 讀取會員 */
  loadMembers(): void {
    this.isLoading = true;
    this.http
      .get<any>(`${this.apiUrl}?page=${this.currentPage}&pageSize=${this.pageSize}`, this.getAuthHeaders())
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
            fBirthDate: res.fBirthDate
              ? new Date(res.fBirthDate).toISOString().split('T')[0]
              : null
          };

          const open = () => {
            // 有城市資料才刷新區域，才能把已存的區帶入選單並預選
            this.refreshDistrictOptions(this.selectedMember!.fCity || '');

            const el = document.getElementById('editMemberModal');
            if (!el) return;
            if (el.parentElement !== document.body) document.body.appendChild(el);
            this.ensureModal(el).show();
          };

          // 若 cityMap 尚未載好 => 先取一次，再 open
          if (!this.cityOptions.length) {
            this.citySvc.getCityMap().pipe(take(1)).subscribe({
              next: (map) => {
                this.cityMap = map;
                this.cityOptions = Object.keys(map);
                open();
              },
              error: () => open() // 就算失敗也讓使用者能編其他欄位
            });
          } else {
            open();
          }
        },
        error: (err) => {
          console.error('載入會員資料失敗', err);
          alert('載入會員資料失敗');
        }
      });
  }

  /** 城市變更 */
  onCityChange(): void {
    const city = this.selectedMember?.fCity || '';
    this.refreshDistrictOptions(city);
  }

  private refreshDistrictOptions(city: string | null | undefined): void {
    const c = (city ?? '').trim();
    const districts = this.cityMap[c];

    // 還沒拿到對應城市的區域清單
    if (!districts) {
      this.districtOptions = [];
      return;
    }

    // 有資料才刷新清單並檢查當前區域是否合法
    this.districtOptions = districts;
    if (!this.selectedMember) return;

    const current = (this.selectedMember.fDistrict ?? '').trim();
    if (current && this.districtOptions.includes(current)) {
      // 合法就保留
      this.selectedMember.fDistrict = current;
    } else {
      // 不合法才清空
      this.selectedMember.fDistrict = '';
    }
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

    this.http.put<any>(`${this.apiUrl}/${id}`, updateData, this.getAuthHeaders()).subscribe({
      next: () => {
        // 更新成功後重新抓單筆刷新列表資料
        this.http.get<Member>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).subscribe({
          next: (fresh) => {
            const idx = this.members.findIndex((m) => m.fMemberId === fresh.fMemberId);
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

    this.http.post<any>(`${this.apiUrl}/upload-profile-picture`, formData, this.getAuthHeaders()).subscribe({
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
    this.http.patch<any>(`${this.apiUrl}/${memberId}/toggle-status`, {}, this.getAuthHeaders()).subscribe({
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
    const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modal.hide();
  }

  /** 開啟新增健康紀錄 Modal */
  openHealthModal(member: Member): void {
    this.selectedHealthMember = member;
    this.healthRecord = {
      recordDate: this.todayString(),
      systolic: null,
      diastolic: null,
      pulse: null,
      ioRecord: '',
      checkPeriod: '',
      notes: ''
    };

    const el = document.getElementById('addHealthRecordModal');
    if (!el) return;
    this.ensureModal(el).show();
  }

  /** 送出健康紀錄 */
  submitHealthRecord(): void {
    if (!this.selectedHealthMember) return;

    const url = `${this.healthApi}?memberId=${this.selectedHealthMember.fMemberId}`;
    const payload = { ...this.healthRecord };

    this.http.post<any>(url, payload, this.getAuthHeaders()).subscribe({
      next: () => {
        alert('健康紀錄新增成功');

        // 關閉 Modal
        const el = document.getElementById('addHealthRecordModal');
        if (el) {
          const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
          modal.hide();
        }

        this.selectedHealthMember = null;
      },
      error: (err) => {
        alert('健康紀錄新增失敗：' + (err?.error?.message ?? '請稍後再試'));
      }
    });
  }

  /** 檢視近 7 天健康紀錄（Modal） */
  openHealthList(member: Member): void {
    if (!member.fResidesInCareHomeStatus) {
      alert('僅限已入住會員可檢視健康紀錄');
      return;
    }
    this.healthListMember = member;
    this.isHealthListLoading = true;

    this.http.get<any[]>(`${this.healthApi}/by-member/${member.fMemberId}`, this.getAuthHeaders()).subscribe({
      next: (rows) => {
        this.healthList = rows ?? [];
        this.isHealthListLoading = false;

        const el = document.getElementById('healthListModal');
        if (!el) return;
        this.ensureModal(el).show();
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

    this.http.put(`${this.healthApi}/${r.id}`, payload, this.getAuthHeaders()).subscribe({
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

    this.http.delete(`${this.healthApi}/${id}`, this.getAuthHeaders()).subscribe({
      next: () => {
        this.healthList = this.healthList.filter((x) => x.id !== id);
        alert('已刪除');
      },
      error: (e) => {
        console.error(e);
        alert('刪除失敗');
      }
    });
  }

  /** 頭像網址處理 */
  getImageUrl(filePath?: string | null): string {
    const base = 'https://localhost:7124';
    if (!filePath) return `${base}/images/members/default-avatar.png`;

    const p = (filePath || '').replace(/^\//, '');
    if (p.startsWith('http')) return p;
    if (p.startsWith('images/') || p.startsWith('uploads/')) return `${base}/${p}`;
    return `${base}/images/members/${p}`;
  }
}
