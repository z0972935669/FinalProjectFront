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
    memberId: [15, Validators.required],
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

    // 2) 取 query string 的 memberId（可選）
    const qMemberId = Number(
      this.route.snapshot.queryParamMap.get('memberId') ?? '0'
    );

    if (!Number.isFinite(batchId)) {
      this.error = '缺少活動編號';
      this.loading = false;
      return;
    }

    this.eventSvc.getEventByBatch(batchId).subscribe({
      next: (dto: EventTemplateDto) => {
        // 3) 用單一批次直接組 VM（不再排序/挑最近）
        const vm = this.mapToVM(dto, batchId, qMemberId > 0 ? qMemberId : 15);
        this.event = vm;

        // 4) 回填表單（包含 hidden 欄位）
        this.form.patchValue({
          batchID: vm.batchID,
          title: vm.title,
          registrationID: vm.registrationID,
          registrationNum: vm.registrationNum,
          memberId: vm.memberId,
          memberPhone: vm.memberPhone,
          amountDue: vm.amountDue,
          registrationDateTime: vm.registrationDateTime,
          currentStatus: vm.currentStatus,
          internalRemarks: vm.internalRemarks ?? '',
        });

        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('getEventByBatch error:', err);
        this.error = '讀取活動失敗';
        this.loading = false;
      },
    });
  }

  /** 將後端 DTO → 報名畫面 VM（單一批次版） */
  private mapToVM(
    t: EventTemplateDto,
    routeBatchId: number,
    memberId: number = 15
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
          });
          alert(`報名成功！您的編號：${res.registrationNum || '—'}`);
        },
        error: (err) => {
          console.error('報名失敗', err);
          this.error = err?.error?.message ?? '報名失敗，請稍後再試';
        },
      });
  }
}
