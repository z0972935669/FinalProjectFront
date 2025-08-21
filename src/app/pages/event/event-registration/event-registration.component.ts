import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import {
  EventTemplateDto,
  EventRegistrationVM,
  RegistrationCreateDto,
} from '../../../interfaces/event/event-list';
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
  private fb = inject(NonNullableFormBuilder); //保證型別不會是 null（所以不用再寫 string | null 這種型別）。
  private route = inject(ActivatedRoute);
  private eventSvc = inject(EventService);
  private memberSvc = inject(MemberService);
  private me?: MemberInfo;
  private router = inject(Router);

  loading = true;
  error = '';
  event?: EventRegistrationVM;
  submitting = false;

  form = this.fb.group({
    //有需填寫的欄位才需要的欄位對弈設定
    batchID: [''], //告訴表單：這個欄位的初始值是多少。
    title: [''],
    registrationID: [0],
    registrationNum: [''],
    memberId: [0, Validators.required], // Validators.required是 Angular 內建的 表單驗證器 (Validator)。檢查該欄位是否有填值。
    memberName: [''],
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
    const raw = this.route.snapshot.paramMap.get('slug') ?? ''; //snapshot 抓取參數  paramMap.get('slug') 看路由那邊的設定
    const batchId = Number(raw.match(/^\d+/)?.[0]);

    if (!Number.isFinite(batchId)) {
      this.error = '缺少活動編號';
      this.loading = false;
      return;
    }
    // 2) 先取得登入者 → Console 顯示 → 再取活動
    this.memberSvc.getMemberInfo().subscribe({
      next: (me: MemberInfo) => {
        console.log('✅ 登入者資料', me);
        this.me = me;

        this.eventSvc.getEventByBatch(batchId).subscribe({
          next: (dto: EventTemplateDto) => {
            const vm = this.mapToVM(dto, batchId, me); //  把 name 傳進去（若有）
            this.event = vm;

            // 回填表單（包含 hidden 欄位）
            this.form.patchValue({
              batchID: vm.batchID,
              title: vm.title,
              registrationID: vm.registrationID,
              registrationNum: vm.registrationNum,
              memberId: Number(me.memberId ?? me.memberId),
              memberName: me.name ?? '未知',
              memberPhone: me.phone ?? '',
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
      },
      error: (err) => {
        console.error('❌ 無法取得登入者資料', err);
        // ⚠️ 直接跳到登入頁
        this.router.navigate(['/show/login']);
        // this.error = '請先登入後再報名';
        this.loading = false;
      },
    });
    this.applyPriceModeValidators();
  }

  /** 將後端 DTO → 報名畫面 VM（單一批次版） */
  private mapToVM(
    t: EventTemplateDto,
    routeBatchId: number,
    me: MemberInfo
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
    // console.log('所有資料', t);
    return {
      batchID: String(batchID),
      title: t.eventName ?? '',
      registrationID: 0,
      registrationNum: '',
      memberId: Number(me.memberId),
      //調整名稱
      // memberName: Number(memberId ?? NaN) === 15 ? '林玉婷' : '未知',
      memberName: me.name ?? '未知',
      memberPhone: me.phone ?? '',
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
    // 先把 memberId 轉成 number
    const memberIdNum = Number(
      this.me?.memberId ?? this.me?.memberId ?? this.form.get('memberId')?.value
    );

    if (!Number.isFinite(memberIdNum) || memberIdNum <= 0) {
      console.error(
        'memberId is invalid:',
        this.me,
        this.form.get('memberId')?.value
      );
      this.submitting = false;
      alert('會員資料異常，請重新登入後再試。');
      return;
    }

    //免費時，不檢查表單整體 invalid；非免費才檢查
    if (!this.isFree && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // 電子發票載具（付費且選電子發票才檢查）
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

    const payload: RegistrationCreateDto = {
      eventBatchId: Number(v.batchID), // number
      memberId: Number(this.me?.memberId), // number
      amountDue: this.isFree ? 0 : Number(v.amountDue ?? 0), // number
      registrationDateTime: new Date().toISOString(), // ISO 字串
      currentStatus: 1, // 建議固定 1=報名成功
      internalRemarks: (v.internalRemarks || '').trim() || null,
    };
    // ★ 在這裡印：你送給 API 的內容
    console.log('[POST] /api/EventRegistration payload =', payload);
    console.log('payload JSON =', JSON.stringify(payload));

    this.eventSvc.register(payload).subscribe({
      next: (res) => {
        this.form.patchValue({
          registrationID: res.registrationId ?? 0,
          registrationNum: res.registrationNum ?? '',
        });
        console.log('編號：' + res.registrationNum);
        alert('報名成功！');

        this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParams: { reg: res.registrationNum }, // 可選：帶編號回去顯示提示
        });
      },
      error: (err) => {
        console.error('報名失敗', err);
        console.log('status:', err.status);
        console.log('title:', err.error?.title);
        console.log('errors:', err.error?.errors); // << 關鍵：顯示是哪個欄位不合格
        this.error = err?.error?.message ?? '報名失敗，請稍後再試';
      },
    });
  }

  // 判斷金額是否為0
  get isFree(): boolean {
    return Number(this.form.get('amountDue')?.value ?? 0) <= 0;
  }

  //  控制送出按鈕禁用：免費時只看 submitting；非免費時要通過所有驗證
  get submitDisabled(): boolean {
    return this.submitting || (!this.isFree && this.form.invalid);
  }
  /** 依是否免費動態調整驗證 */
  private applyPriceModeValidators(): void {
    const agree = this.form.get('agree');
    const payGroup = this.form.get('payment') as FormGroup;
    const method = payGroup?.get('paymentMethod');
    const invoice = payGroup?.get('invoiceType');
    const carrier = payGroup?.get('eInvoiceCarrier');

    if (this.isFree) {
      // 免費：拿掉與付款相關的驗證，條款勾選也不強制
      agree?.clearValidators();
      method?.clearValidators();
      invoice?.clearValidators();
      carrier?.clearValidators();
    } else {
      // 需付費：恢復驗證
      agree?.setValidators(Validators.requiredTrue);
      method?.setValidators(Validators.required);
      invoice?.setValidators(Validators.required);
      // carrier 留給 submit 時視電子發票再檢查
    }

    agree?.updateValueAndValidity({ emitEvent: false });
    method?.updateValueAndValidity({ emitEvent: false });
    invoice?.updateValueAndValidity({ emitEvent: false });
    carrier?.updateValueAndValidity({ emitEvent: false });
  }

  private toLocalIsoSeconds(d = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
  }
}
