import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-stripe-payment',
  standalone: true,
  template: `
    <div>
      @if (error()) {
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error() }}
        </div>
      }
      <div id="stripe-payment-element" class="mb-6"></div>
      <button
        type="button"
        (click)="confirmPayment()"
        [disabled]="loading() || !ready()"
        class="w-full bg-[#4557A7] hover:bg-[#374899] text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-60"
      >
        {{ loading() ? 'Processing…' : 'Pay ' + formattedTotal }}
      </button>
    </div>
  `,
})
export class StripePaymentComponent implements OnInit, OnDestroy {
  @Input({ required: true }) clientSecret!: string;
  @Input({ required: true }) totalCents!: number;
  @Output() paymentSuccess = new EventEmitter<void>();
  @Output() paymentError = new EventEmitter<string>();

  loading = signal(false);
  error = signal('');
  ready = signal(false);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  get formattedTotal() {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.totalCents / 100);
  }

  async ngOnInit() {
    this.stripe = await loadStripe(environment.stripePublishableKey);
    if (!this.stripe) {
      this.error.set('Could not load payment processor.');
      return;
    }
    this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#4557A7', fontFamily: 'DM Sans, sans-serif' },
    }});
    this.paymentElement = this.elements.create('payment');
    this.paymentElement.mount('#stripe-payment-element');
    this.paymentElement.on('ready', () => this.ready.set(true));
  }

  ngOnDestroy() {
    this.paymentElement?.destroy();
  }

  async confirmPayment() {
    if (!this.stripe || !this.elements) return;
    this.loading.set(true);
    this.error.set('');
    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: { return_url: window.location.origin + '/orders' },
      redirect: 'if_required',
    });
    if (error) {
      this.error.set(error.message ?? 'Payment failed.');
      this.paymentError.emit(error.message);
      this.loading.set(false);
    } else {
      this.paymentSuccess.emit();
    }
  }
}
