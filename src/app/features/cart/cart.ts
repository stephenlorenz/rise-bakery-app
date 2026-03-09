import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="font-serif text-4xl text-[#3E2723] mb-8">Your Cart</h1>

      @if (cart.isEmpty()) {
        <div class="text-center py-20">
          <p class="text-[#8D7B68] text-lg mb-6">Your cart is empty.</p>
          <a routerLink="/menu" class="bg-[#B85C38] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#9A4A2C] transition-colors">
            Browse Menu
          </a>
        </div>
      } @else {
        <div class="space-y-4 mb-8">
          @for (item of cart.items(); track item.product.id) {
            <div class="bg-white rounded-xl border border-[#E8D5B7] p-4 flex items-center gap-4">
              <!-- Image -->
              @if (item.product.image_url) {
                <img [src]="item.product.image_url" [alt]="item.product.name"
                     class="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              } @else {
                <div class="w-20 h-20 bg-[#F5EFE6] rounded-lg flex-shrink-0"></div>
              }
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-serif text-lg text-[#3E2723]">{{ item.product.name }}</h3>
                <p class="text-[#8D7B68] text-sm">{{ formatPrice(item.product.price_cents) }} each</p>
              </div>
              <!-- Quantity -->
              <div class="flex items-center gap-2">
                <button
                  (click)="cart.updateQuantity(item.product.id, item.quantity - 1)"
                  class="w-8 h-8 rounded-full border border-[#E8D5B7] flex items-center justify-center text-[#3E2723] hover:bg-[#F5EFE6]"
                >−</button>
                <span class="w-6 text-center font-medium text-[#3E2723]">{{ item.quantity }}</span>
                <button
                  (click)="cart.updateQuantity(item.product.id, item.quantity + 1)"
                  class="w-8 h-8 rounded-full border border-[#E8D5B7] flex items-center justify-center text-[#3E2723] hover:bg-[#F5EFE6]"
                >+</button>
              </div>
              <!-- Line total -->
              <p class="font-semibold text-[#3E2723] w-20 text-right">
                {{ formatPrice(item.product.price_cents * item.quantity) }}
              </p>
              <!-- Remove -->
              <button
                (click)="cart.removeItem(item.product.id)"
                class="text-[#8D7B68] hover:text-red-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          }
        </div>

        <!-- Summary -->
        <div class="bg-white rounded-xl border border-[#E8D5B7] p-6">
          <div class="flex justify-between items-center mb-6">
            <span class="text-[#8D7B68]">Total</span>
            <span class="font-serif text-2xl text-[#3E2723]">{{ formatPrice(cart.totalCents()) }}</span>
          </div>
          <a routerLink="/checkout"
             class="block w-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-center font-medium py-4 rounded-lg transition-colors">
            Proceed to Checkout
          </a>
          <a routerLink="/menu" class="block text-center text-sm text-[#8D7B68] hover:text-[#3E2723] mt-4">
            ← Continue shopping
          </a>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  cart = inject(CartService);

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }
}
