import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  template: `
    <!-- Hero -->
    <section class="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden bg-[#3E2723]">
      <div class="absolute inset-0 bg-gradient-to-b from-[#3E2723]/40 to-[#3E2723]/70 z-10"></div>
      <div class="absolute inset-0 bg-[url('/hero-bakery.png')] bg-cover bg-center"></div>
      <div class="relative z-20 text-center px-4">
        <p class="text-[#E8D5B7] text-sm tracking-widest uppercase mb-4 font-sans">Handcrafted · Small Batch · Local</p>
        <h1 class="font-serif text-5xl md:text-7xl text-white mb-6 leading-tight">
          Fresh from<br>our oven
        </h1>
        <p class="text-[#E8D5B7] text-lg mb-8 max-w-md mx-auto">
          Artisan bread loaves baked weekly. Place your order and pick up fresh.
        </p>
        <a routerLink="/menu"
           class="inline-block bg-[#B85C38] hover:bg-[#9A4A2C] text-white font-medium px-8 py-4 rounded-full transition-colors text-lg">
          Shop the Menu
        </a>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="max-w-6xl mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h2 class="font-serif text-4xl text-[#3E2723] mb-3">This Week's Loaves</h2>
        <p class="text-[#8D7B68]">Limited quantities — order early</p>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-2xl overflow-hidden border border-[#E8D5B7] animate-pulse">
              <div class="aspect-[4/3] bg-[#E8D5B7]"></div>
              <div class="p-5 space-y-3">
                <div class="h-6 bg-[#E8D5B7] rounded w-2/3"></div>
                <div class="h-4 bg-[#E8D5B7] rounded"></div>
                <div class="h-4 bg-[#E8D5B7] rounded w-3/4"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          @for (product of featuredProducts(); track product.id) {
            <app-product-card [product]="product" (addToCart)="onAddToCart($event)" />
          }
        </div>
        @if (featuredProducts().length > 0) {
          <div class="text-center mt-10">
            <a routerLink="/menu" class="text-[#B85C38] hover:underline font-medium">
              View full menu →
            </a>
          </div>
        }
      }
    </section>

    <!-- How it works -->
    <section class="bg-[#3E2723] py-16 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="font-serif text-4xl text-white mb-12">How it works</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          @for (step of steps; track step.num) {
            <div>
              <div class="w-12 h-12 rounded-full bg-[#B85C38] text-white font-serif text-xl flex items-center justify-center mx-auto mb-4">
                {{ step.num }}
              </div>
              <h3 class="font-serif text-xl text-white mb-2">{{ step.title }}</h3>
              <p class="text-[#8D7B68] text-sm">{{ step.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  loading = signal(true);
  featuredProducts = signal<Product[]>([]);

  steps = [
    { num: 1, title: 'Browse & order', desc: 'Choose your loaves and add them to your cart.' },
    { num: 2, title: 'Pay securely', desc: 'Checkout with Stripe — safe & encrypted.' },
    { num: 3, title: 'Pick up fresh', desc: 'Grab your order at your chosen pickup time.' },
  ];

  async ngOnInit() {
    const products = await this.productService.getActiveProducts();
    this.featuredProducts.set(products.slice(0, 3));
    this.loading.set(false);
  }

  onAddToCart(product: Product) {
    this.cartService.addItem(product);
  }
}
