import { Component, inject, signal, OnInit } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product';
import { ProductCardComponent } from '../product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ProductCardComponent, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-12">
      <div class="mb-10">
        <h1 class="font-serif text-4xl text-[#3E2723] mb-2">Our Menu</h1>
        <p class="text-[#8D7B68]">Freshly baked, available for pickup. Quantities are limited.</p>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white rounded-2xl overflow-hidden border border-[#E8D5B7] animate-pulse">
              <div class="aspect-[4/3] bg-[#E8D5B7]"></div>
              <div class="p-5 space-y-3">
                <div class="h-6 bg-[#E8D5B7] rounded w-2/3"></div>
                <div class="h-4 bg-[#E8D5B7] rounded"></div>
              </div>
            </div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="text-center py-20">
          <p class="text-[#8D7B68] text-lg">No products available right now. Check back soon!</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          @for (product of products(); track product.id) {
            <app-product-card [product]="product" (addToCart)="onAddToCart($event)" />
          }
        </div>
      }

      @if (added()) {
        <div class="fixed bottom-6 right-6 bg-[#3E2723] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          Added to cart! <a routerLink="/cart" class="underline ml-2">View cart</a>
        </div>
      }
    </div>
  `,
})
export class MenuComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  loading = signal(true);
  products = signal<Product[]>([]);
  added = signal(false);

  async ngOnInit() {
    const products = await this.productService.getActiveProducts();
    this.products.set(products);
    this.loading.set(false);
  }

  onAddToCart(product: Product) {
    this.cartService.addItem(product);
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2500);
  }
}
