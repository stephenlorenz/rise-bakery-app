import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { PickupSelectorComponent } from './pickup-selector/pickup-selector';
import { StripePaymentComponent } from './stripe-payment/stripe-payment';

type Step = 'pickup' | 'payment' | 'success';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [PickupSelectorComponent, StripePaymentComponent, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12">
      <h1 class="font-serif text-4xl text-[#3E2723] mb-2">Checkout</h1>

      <!-- Steps indicator -->
      <div class="flex items-center gap-2 mb-10">
        <span [class]="stepClass('pickup')">1. Pickup</span>
        <div class="flex-1 h-px bg-[#E8D5B7]"></div>
        <span [class]="stepClass('payment')">2. Payment</span>
        <div class="flex-1 h-px bg-[#E8D5B7]"></div>
        <span [class]="stepClass('success')">3. Confirmed</span>
      </div>

      @if (step() === 'pickup') {
        <div class="bg-white rounded-2xl border border-[#E8D5B7] p-6 mb-6">
          <h2 class="font-serif text-xl text-[#3E2723] mb-5">Select pickup time</h2>
          <app-pickup-selector (selectionChange)="onPickupSelected($event)" />
        </div>

        <!-- Order summary -->
        <div class="bg-white rounded-2xl border border-[#E8D5B7] p-6 mb-6">
          <h2 class="font-serif text-xl text-[#3E2723] mb-4">Order summary</h2>
          @for (item of cart.items(); track item.product.id) {
            <div class="flex justify-between py-2 text-sm border-b border-[#F5EFE6] last:border-0">
              <span class="text-[#3E2723]">{{ item.product.name }} × {{ item.quantity }}</span>
              <span class="text-[#8D7B68]">{{ formatPrice(item.product.price_cents * item.quantity) }}</span>
            </div>
          }
          <div class="flex justify-between pt-3 font-semibold">
            <span class="text-[#3E2723]">Total</span>
            <span class="text-[#3E2723]">{{ formatPrice(cart.totalCents()) }}</span>
          </div>
        </div>

        <button
          (click)="proceedToPayment()"
          [disabled]="!pickup() || creatingIntent()"
          class="w-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-60"
        >
          {{ creatingIntent() ? 'Preparing…' : 'Continue to payment' }}
        </button>

        @if (intentError()) {
          <p class="text-red-600 text-sm mt-3 text-center">{{ intentError() }}</p>
        }
      }

      @if (step() === 'payment' && clientSecret()) {
        <div class="bg-white rounded-2xl border border-[#E8D5B7] p-6">
          <h2 class="font-serif text-xl text-[#3E2723] mb-5">Payment</h2>
          @if (pickup()) {
            <p class="text-sm text-[#8D7B68] mb-6">
              Pickup: {{ formatDate(pickup()!.date) }} at {{ pickup()!.time }}
            </p>
          }
          <app-stripe-payment
            [clientSecret]="clientSecret()!"
            [totalCents]="cart.totalCents()"
            (paymentSuccess)="onPaymentSuccess()"
            (paymentError)="onPaymentError($event)"
          />
        </div>
      }

      @if (step() === 'success') {
        <div class="text-center py-16">
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="font-serif text-3xl text-[#3E2723] mb-3">Order confirmed!</h2>
          <p class="text-[#8D7B68] mb-8">
            Your order is confirmed for pickup on {{ formatDate(pickup()?.date ?? '') }} at {{ pickup()?.time }}.
          </p>
          <a routerLink="/orders" class="bg-[#B85C38] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#9A4A2C] transition-colors">
            View my orders
          </a>
        </div>
      }
    </div>
  `,
})
export class CheckoutComponent {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  step = signal<Step>('pickup');
  pickup = signal<{ date: string; time: string } | null>(null);
  clientSecret = signal<string | null>(null);
  creatingIntent = signal(false);
  intentError = signal('');

  onPickupSelected(selection: { date: string; time: string } | null) {
    this.pickup.set(selection);
  }

  async proceedToPayment() {
    if (!this.pickup()) return;
    this.creatingIntent.set(true);
    this.intentError.set('');
    try {
      const { data, error } = await this.supabase.client.functions.invoke('create-payment-intent', {
        body: {
          items: this.cart.items().map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          pickupDate: this.pickup()!.date,
          pickupTime: this.pickup()!.time,
        },
      });
      if (error) throw error;
      this.clientSecret.set(data.clientSecret);
      this.step.set('payment');
    } catch (err: any) {
      this.intentError.set(err.message ?? 'Could not start payment. Try again.');
    } finally {
      this.creatingIntent.set(false);
    }
  }

  onPaymentSuccess() {
    this.cart.clear();
    this.step.set('success');
  }

  onPaymentError(msg: string) {
    // Error is displayed inside the stripe-payment component
  }

  stepClass(s: Step): string {
    const active = this.step() === s;
    const done =
      (s === 'pickup' && (this.step() === 'payment' || this.step() === 'success')) ||
      (s === 'payment' && this.step() === 'success');
    if (active) return 'text-[#B85C38] font-medium text-sm';
    if (done) return 'text-[#8D7B68] text-sm line-through';
    return 'text-[#8D7B68] text-sm';
  }

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}
