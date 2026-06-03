import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 bg-[#EDECE8] border-b border-[#C5CADF] shadow-sm">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        <!-- Logo -->
        <a routerLink="/">
          <img src="rise-bakery-logo.svg" alt="Rise Bakery" class="h-10 w-auto" />
        </a>

        <!-- Nav -->
        <nav class="hidden md:flex items-center gap-6">
          <a routerLink="/menu" routerLinkActive="text-[#4557A7]"
             class="text-sm font-medium text-[#1E2347] hover:text-[#4557A7] transition-colors">
            Menu
          </a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/orders" routerLinkActive="text-[#4557A7]"
               class="text-sm font-medium text-[#1E2347] hover:text-[#4557A7] transition-colors">
              Orders
            </a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="text-[#4557A7]"
               class="text-sm font-medium text-[#4557A7] hover:text-[#374899] transition-colors">
              Admin
            </a>
          }
        </nav>

        <!-- Right actions -->
        <div class="flex items-center gap-3">
          <!-- Cart -->
          <a routerLink="/cart" class="relative p-2 text-[#1E2347] hover:text-[#4557A7] transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            @if (cart.count() > 0) {
              <span class="absolute -top-0.5 -right-0.5 bg-[#4557A7] text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {{ cart.count() }}
              </span>
            }
          </a>

          <!-- Auth -->
          @if (auth.isLoggedIn()) {
            <button
              (click)="signOut()"
              class="text-sm font-medium text-[#7279A5] hover:text-[#1E2347] transition-colors"
            >
              Sign out
            </button>
          } @else {
            <a routerLink="/account/login"
               class="text-sm font-medium bg-[#4557A7] hover:bg-[#374899] text-white px-4 py-2 rounded-lg transition-colors">
              Sign in
            </a>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  private router = inject(Router);

  async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}
