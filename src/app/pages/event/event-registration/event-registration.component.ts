import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import {
  EventBatchDto,
  EventTemplateDto,
  EventRegistrationVM,
} from '../../../interfaces/event/event-list';
import { finalize } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import {
  MemberInfo,
  MemberService,
} from '../../../services/member/member.service';

@Component({
  standalone: true,
  selector: 'app-event-registration',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './event-registration.component.html',
  styleUrls: ['./event-registration.component.scss'],
})
export class EventRegistrationComponent {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private eventSvc = inject(EventService);
  private memberSvc = inject(MemberService);

  loading = true;
  error = '';
  event?: EventRegistrationVM;
  submitting = false;

  form = this.fb.group({
    // ⚠️ 你的 VM / 後端用的是 batchID（大寫 ID），這裡維持一致
    batchID: [''],
    title: [''],
    registrationID: [0],
    registrationNum: [''],
    memberId: [0, Validators.required],
    memberPhone: [''],
    amountDue: [0, Validators.required],
    registrationDateTime: [''],
    currentStatus: [0],
    internalRemarks: [''],

    agree: [false, Validators.requiredTrue],
    payment: this.fb.group({
      paymentMethod: ['CASH', Validators.required],
      invoiceType: ['二聯式', Validators.required],
      invoiceTitle: [''],
      taxId: ['', Validators.pattern(/^\d{8}$/)],
      eInvoiceCarrier: [''],
    }),
  });

  ngOnInit(): void {
    // 1) 取 batchId（從 slug 抓開頭數字）
    const raw = this.route.snapshot.paramMap.get('slug') ?? '';
    const batchId = Number(raw.match(/^\d+/)?.[0]);
    // 從 JWT 取登入者
    const me = this.getMemberFromToken();
    const memberId = 15;

    if (!Number.isFinite(batchId)) {
      this.error = '缺少活動編號';
      this.loading = false;
      return;
    }
    // 2) 先取得登入者 → Console 顯示 → 再取活動
    this.memberSvc.getMemberInfo().subscribe({
      next: (me: MemberInfo) => {
        console.log('✅ 登入者資料', me); // ★ 這裡會顯示登入者資料
        const memberId = me.memberId;

        this.eventSvc.getEventByBatch(batchId).subscribe({
          next: (dto: EventTemplateDto) => {
            const vm = this.mapToVM(dto, batchId, memberId); // ★ 把 name 傳進去（若有）
            this.event = vm;

            // 回填表單（包含 hidden 欄位）
            this.form.patchValue({
              batchID: vm.batchID,
              title: vm.title,
              registrationID: vm.registrationID,
              registrationNum: vm.registrationNum,
              memberId: memberId,
              memberPhone: vm.memberPhone,
              amountDue: vm.amountDue,
              registrationDateTime: vm.registrationDateTime,
              currentStatus: vm.currentStatus,
              internalRemarks: vm.internalRemarks ?? '',
            });

            console.log('API 原始資料', dto);
            console.log('映射後 VM', this.event);
            this.loading = false;
          },
          error: (err: unknown) => {
            console.error('getEventByBatch error:', err);
            this.error = '讀取活動失敗';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error('❌ 無法取得登入者資料', err);
        this.error = '請先登入後再報名';
        this.loading = false;
      },
    });
  }

  /** 將後端 DTO → 報名畫面 VM（單一批次版） */
  private mapToVM(
    t: EventTemplateDto,
    routeBatchId: number,
    memberId: number
  ): EventRegistrationVM {
    // 後端 by-batch 通常只回一筆批次；仍兼容 eventBatches/batches 兩種鍵
    const batch =
      (t.batches && t.batches[0]) ||
      (t.eventBatches && t.eventBatches[0]) ||
      null;

    const batchID = batch?.batchID ?? routeBatchId;
    const start = batch?.eventDateTimeStart
      ? new Date(batch.eventDateTimeStart)
      : null;
    console.log('所有資料', t);
    return {
      batchID: String(batchID),
      title: t.eventName ?? '',
      registrationID: 0,
      registrationNum: '',
      memberId: Number(memberId),
      memberName: Number(memberId ?? NaN) === 15 ? '林玉婷' : '未知',
      memberPhone: '0934-567-888',
      amountDue: Number(t.amount ?? 0),
      registrationDateTime: new Date().toISOString(),
      currentStatus: 0,
      internalRemarks: null,
      date: start ? this.fmtDate(start) : '',
    };
  }

  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${hh}:${mm}`;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const invType = this.form.get('payment.invoiceType')?.value;
    if (
      invType === '電子發票' &&
      !this.form.get('payment.eInvoiceCarrier')?.value
    ) {
      this.form.get('payment.eInvoiceCarrier')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.getRawValue();

    const dto = {
      eventBatchId: Number(v.batchID), // ← 直接用單一批次
      memberId: Number(v.memberId),
      amountDue: v.amountDue ?? null,
      registrationDateTime: v.registrationDateTime || new Date().toISOString(),
      currentStatus: Number(v.currentStatus ?? 1),
      internalRemarks: (v.internalRemarks ?? '').trim() || null,
    };

    this.eventSvc
      .register(dto)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => {
          this.form.patchValue({
            registrationID: res.registrationId ?? 0,
            registrationNum: res.registrationNum ?? '',
            // memberId: memberId,
          });
          alert(`報名成功！您的編號：${res.registrationNum || '—'}`);
        },
        error: (err) => {
          console.error('報名失敗', err);
          this.error = err?.error?.message ?? '報名失敗，請稍後再試';
        },
      });
  }

  getMemberFromToken(): { memberId: number; name?: string } | null {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        Array.from(atob(b64))
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      const payload = JSON.parse(json);

      // 依你的後端 Claim 名稱對齊
      const id = payload.memberId ?? payload.sub ?? payload.userId;
      return id
        ? { memberId: Number(id), name: payload.name ?? payload.username }
        : null;
    } catch {
      return null;
    }
  }
}
