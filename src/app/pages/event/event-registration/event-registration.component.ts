import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

type RegistrationDetailsDto = {
  eventBatchID: number;
  memberID: number;
  amountDue: number | null;
  internalRemarks?: string | null;
};
type EventPaymentDetailsDto = {
  paymentMethod: 'CASH' | 'CARD' | 'LINEPAY';
  paymentItem: string;
  paymentAmount: number;
  invoiceType: string;
  invoiceTitle?: string | null;
  taxID?: string | null;
  eInvoiceCarrier?: string | null;
};

@Component({
  standalone: true,
  selector: 'app-event-registration',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './event-registration.component.html',
  styleUrls: ['./event-registration.component.scss'], // 兼容性較好
})
export class EventRegistrationComponent {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);

  event = {
    eventId: 3,
    eventName: '太極體驗課',
    amount: 100,
    date: '2025/08/15 10:00',
  };
  user = { id: 101, name: '王小美', phone: '0912-345-678' };
  submitting = false;

  form = this.fb.group({
    amountDue: this.fb.control(this.event.amount, {
      validators: [Validators.required, Validators.min(0)],
    }),
    internalRemarks: this.fb.control(''),
    agree: this.fb.control(false, { validators: Validators.requiredTrue }),
    payment: this.fb.group({
      paymentMethod: this.fb.control<'CASH' | 'CARD' | 'LINEPAY'>(
        'LINEPAY',
        Validators.required
      ),
      invoiceType: this.fb.control('二聯式', Validators.required),
      invoiceTitle: this.fb.control(''),
      taxId: this.fb.control(''),
      eInvoiceCarrier: this.fb.control(''),
    }),
  });

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;

    const reg: RegistrationDetailsDto = {
      eventBatchID: this.event.eventId,
      memberID: this.user.id,
      amountDue: this.form.value.amountDue ?? 0,
      internalRemarks: this.form.value.internalRemarks ?? null,
    };

    const p = this.form.value.payment!;
    const pay: EventPaymentDetailsDto = {
      paymentMethod: p.paymentMethod as any,
      paymentItem: '活動報名費',
      paymentAmount: this.form.value.amountDue ?? 0,
      invoiceType: p.invoiceType!,
      invoiceTitle: p.invoiceTitle || null,
      taxID: p.taxId || null,
      eInvoiceCarrier: p.eInvoiceCarrier || null,
    };

    console.log('REG', reg, 'PAY', pay);
    this.submitting = false;
  }
}
