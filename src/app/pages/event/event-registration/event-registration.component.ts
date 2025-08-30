import { CommonModule } from '@angular/common';
import { Component, inject, NgZone } from '@angular/core';
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
import {
  catchError,
  finalize,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

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
  private zone = inject(NgZone);
  //小視窗
  payWin: Window | null = null;
  uiBlocked = false;

  loading = true;
  error = '';
  event?: EventRegistrationVM;
  submitting = false; //這兩個差在哪裡????????????????????
  submitted = false; //這兩個差在哪裡????????????????????
  private destroy$ = new Subject<void>();

  form = this.fb.group({
    //有需填寫的欄位才需要的欄位對應設定
    batchID: [''], //告訴表單：這個欄位的初始值是多少。
    title: [''],
    date: [''], //顯示活動時間
    registrationID: [0],
    registrationNum: [''],
    memberId: [0, Validators.required], // Validators.required是 Angular 內建的 表單驗證器 (Validator)。檢查該欄位是否有填值。
    memberName: [''],
    memberPhone: [''],
    amountDue: [0, Validators.required],
    registrationDateTime: [''],
    currentStatus: [0], //0=未繳、1=已繳、9=失敗
    internalRemarks: [''],

    agree: [false, Validators.requiredTrue],
    payment: this.fb.group({
      paymentMethod: ['CASH'],
      invoiceType: ['紙本'],
      invoiceTitle: [''],
      taxId: ['', Validators.pattern(/^\d{8}$/)],
      eInvoiceCarrier: [''],
    }),
  });

  // 收到[linepay跳出視窗]的回應
  private onLinePayMessage = (ev: MessageEvent) => {
    const data = ev.data || {};
    if (data.type !== 'LINEPAY_DONE') return; //彈出視窗關閉後(回傳LINEPAY_DONE)執行的

    // 收到付款結果 → 解鎖、提示、關窗
    this.zone.run(() => {
      //使用第三方SDK callback時需透過zone 畫面才會更新   把後續程式放到 Angular 的 NgZone 裡執行，確保 UI 可以即時更新（避免 Angular 偵測不到外部事件造成畫面不變）。

      if (data.ok) {
        alert('已付款完成！');
        this.router.navigate(['../'], {
          relativeTo: this.route,
        });
      } else {
        // 解鎖
        this.uiBlocked = false;
        this.form.enable({ emitEvent: false });
        this.submitting = false;
        alert(`付款未完成或失敗${data.message ? '：' + data.message : ''}`);
      }
    });
  };

  ngOnInit(): void {
    //  綁定事件監聽器 → 告訴瀏覽器「當有訊息傳來，要叫誰處理」linepay小視窗監聽
    window.addEventListener('message', this.onLinePayMessage);
    // 1) 取 batchId（從 slug 抓開頭數字）
    const raw = this.route.snapshot.paramMap.get('slug') ?? ''; //snapshot 抓取參數  paramMap.get('slug') 看路由那邊的設定
    const batchId = Number(raw.match(/^\d+/)?.[0]);

    if (!Number.isFinite(batchId)) {
      this.error = '缺少活動編號';
      this.loading = false;
      return;
    }
    // 2) 串會員 → 活動 → 報名
    this.loading = true;
    this.memberSvc
      .getMemberInfo()
      .pipe(
        tap((me) => {
          this.me = me;
          console.log('✅ 登入者資料', me);
        }), // tap記錄到 this.me、回填表單
        switchMap(
          (
            me //switchMap用「會員」結果去串第二個 API（活動）
          ) =>
            this.eventSvc.getEventByBatch(batchId).pipe(
              tap((dto) => {
                const vm = this.mapToVM(dto, batchId, me);
                this.event = vm;
                this.form.patchValue({
                  batchID: vm.batchID,
                  title: vm.title,
                  date: vm.date,
                  registrationID: vm.registrationID,
                  registrationNum: vm.registrationNum,
                  memberId: Number(me.memberId),
                  memberName: me.name ?? '未知',
                  memberPhone: me.phone ?? '',
                  amountDue: vm.amountDue,
                  registrationDateTime: vm.registrationDateTime,
                  currentStatus: vm.currentStatus,
                  internalRemarks: vm.internalRemarks ?? '',
                });
              })
            )
        ),
        catchError((err) => {
          console.error('讀取資料失敗', err);
          // 若是會員失敗 → 導登入；活動失敗 → 顯示錯誤
          if (!this.me) {
            this.router.navigate(['/show/login']);
          } else {
            this.error = '讀取活動失敗';
          }
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.applyPriceModeValidators();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
  // 卸載監聽
  ngOnDestroy(): void {
    window.removeEventListener('message', this.onLinePayMessage);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* 從api抓取資料放到報名畫面上*/
  private mapToVM(
    t: EventTemplateDto,
    routeBatchId: number,
    me: MemberInfo
  ): EventRegistrationVM {
    //回傳型別
    const batch = (t.eventBatches && t.eventBatches[0]) || null;
    // const batch =
    //   (t.batches && t.batches[0]) ||
    //   (t.eventBatches && t.eventBatches[0]) ||
    //   null;
    const batchID = batch?.batchID ?? routeBatchId; //如果batch不是null 則抓取batch.batchID
    // ?? 是 Nullish Coalescing Operator（空值合併運算子） A??B 如果A為空則用B

    const start = batch?.eventDateTimeStart
      ? new Date(batch.eventDateTimeStart) //如果有值則轉換資料型態
      : null;
    // console.log('所有資料', t);
    return {
      batchID: String(batchID),
      title: t.eventName ?? '',
      registrationID: 0,
      registrationNum: '',
      memberId: Number(me.memberId),
      memberName: me.name ?? '未知',
      memberPhone: me.phone ?? '請於會員資料填寫電話號碼',
      amountDue: Number(t.amount ?? 0),
      registrationDateTime: new Date().toISOString(),
      currentStatus: 0,
      internalRemarks: null,
      date: start ? this.fmtDate(start) : '',
    };
  }

  submit() {
    this.submitted = true;
    const payGroup = this.form.get('payment') as FormGroup;
    const invoiceType = payGroup.get('invoiceType')?.value;
    const carrier = payGroup.get('eInvoiceCarrier')?.value?.trim();
    const method = this.form.get('payment.paymentMethod')?.value;
    const amount = Number(this.form.get('amountDue')?.value ?? 0);
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
    if (method === 'LINEPAY' && invoiceType === '電子發票' && !carrier) {
      alert('付款為 LINE Pay 且選擇電子發票時，必須填寫載具！');
      return;
    }

    //免費時，不檢查表單整體 invalid；非免費才檢查
    if (!this.isFree && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // 電子發票載具（檢查載具欄位是否填寫）0828
    this.submitting = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return; // 阻止送出，讓錯誤訊息顯示
    }

    this.submitting = true;
    const v = this.form.getRawValue();

    const base: RegistrationCreateDto = {
      eventBatchId: Number(v.batchID),
      memberId: Number(this.me?.memberId ?? this.form.get('memberId')?.value),
      amountDue: this.isFree ? 0 : Number(v.amountDue ?? 0),
      registrationDateTime: new Date().toISOString(),
      currentStatus: 1,
      internalRemarks: (v.internalRemarks || '').trim() || null,
    };

    const payload: RegistrationCreateDto = this.isFree
      ? base
      : {
          ...base,
          payment: {
            paymentMethod: v.payment?.paymentMethod!,
            paymentItem: '活動報名費',
            paymentAmount: Number(v.amountDue ?? 0),
            invoiceType: v.payment?.invoiceType!,
            invoiceTitle: v.payment?.invoiceTitle || '',
            taxId: v.payment?.taxId || '',
            eInvoiceCarrier: v.payment?.eInvoiceCarrier || '',
            transactionId: null,
          },
        };

    // 若要走 LINEPAY，先開小視窗與鎖畫面（同一使用者點擊事件）
    // const method = this.form.get('payment.paymentMethod')?.value;
    // const amount = Number(this.form.get('amountDue')?.value ?? 0);
    if (method === 'LINEPAY' && amount > 0) {
      this.payWin = this.openPopupSkeleton();
    }

    this.eventSvc.register(payload).subscribe({
      next: (res: any) => {
        // 灌回編號
        const reg = res?.registration ?? res;
        this.form.patchValue({
          registrationID: reg?.registrationId ?? 0,
          registrationNum: reg?.registrationNum ?? '',
        });

        // 若後端回了 linePay.paymentUrl → 導小視窗去 LINE Pay，主畫面維持鎖定
        const linePay = res?.linePay as { paymentUrl?: string } | null;
        if (linePay?.paymentUrl) {
          this.navigatePopup(linePay.paymentUrl);
          this.submitting = false;
          return; // 等 postMessage 再解鎖 + 提示
        }
        // 免費或非 LINEPAY
        this.uiBlocked = false;
        this.form.enable({ emitEvent: false });
        console.log('編號：' + res.registrationNum);
        alert('報名成功！');

        this.router.navigate(['../'], {
          relativeTo: this.route,
          queryParams: { reg: res.registrationNum }, // 可選：帶編號回去顯示提示
        });
      },
      error: (err) => {
        //若有開小視窗，關掉；解除鎖定
        try {
          this.payWin?.close();
        } catch {}
        this.payWin = null;
        this.uiBlocked = false;
        this.form.enable({ emitEvent: false });
        this.submitting = false;
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

  /** NEW: 先開一個小視窗骨架 + 鎖畫面，避免 popup 被擋 */
  private openPopupSkeleton() {
    const features =
      'width=520,height=720,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes';
    const w = window.open('', 'linepay_popup', features);
    if (w) {
      w.document.write(
        '<!doctype html><meta charset="utf-8"><title>前往 LINE Pay</title>' +
          '<div style="font:14px/1.5 sans-serif;padding:20px">正在開啟付款頁，請稍候…</div>'
      );
      this.uiBlocked = true;
      this.form.disable({ emitEvent: false });
    }
    return w;
  }

  /** 導向小視窗；若被瀏覽器擋，提示使用者允許彈出視窗 */
  private navigatePopup(url: string) {
    if (this.payWin) {
      this.payWin.location.href = url;
      return;
    }
    const w = this.openPopupSkeleton();
    if (w) {
      w.location.href = url;
    } else {
      // 不強制改本頁導向，符合你「原畫面不換頁」的需求
      this.uiBlocked = false;
      this.form.enable({ emitEvent: false });
      alert('瀏覽器阻擋了彈出視窗，請允許此站台彈出視窗後再試一次。');
    }
  }
  //活動日期顯示調整：2025/08/15 10:00
  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${hh}:${mm}`;
  }
}
