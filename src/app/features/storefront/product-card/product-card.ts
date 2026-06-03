import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#C5CADF] flex flex-col hover:shadow-md transition-shadow">
      <!-- Image -->
      <div class="aspect-[4/3] overflow-hidden bg-[#F5EFE6]">
        @if (product.image_url) {
          <img
            [src]="product.image_url"
            [alt]="product.name"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-16 h-16 text-[#C5CADF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        }
      </div>

      <!-- Content -->
      <div class="p-5 flex flex-col flex-1">
        <h3 class="font-serif text-xl text-[#1E2347] mb-1">{{ product.name }}</h3>
        <p class="text-sm text-[#7279A5] mb-4 flex-1 line-clamp-2 min-h-[2.5rem]">{{ product.description }}</p>
        <div class="flex items-center justify-between mt-auto">
          <span class="text-lg font-semibold text-[#1E2347]">{{ formatPrice(product.price_cents) }}</span>
          <button
            (click)="addToCart.emit(product)"
            class="bg-[#4557A7] hover:bg-[#374899] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }
}
