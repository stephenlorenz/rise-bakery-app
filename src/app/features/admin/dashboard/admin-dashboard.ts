import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex min-h-screen bg-[#EDECE8]">
      <!-- Sidebar -->
      <aside class="w-60 bg-[#1E2347] text-[#C5CADF] flex flex-col shrink-0">
        <div class="p-6 border-b border-[#5D3A35]">
          <p class="font-serif text-xl text-white">Rise Bakery</p>
          <p class="text-xs text-[#7279A5] mt-1">Admin Panel</p>
        </div>
        <nav class="flex-1 p-4 space-y-1">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-[#4557A7] text-white"
              class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5D3A35] transition-colors"
            >
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>
        <div class="p-4 border-t border-[#5D3A35]">
          <a routerLink="/" class="text-xs text-[#7279A5] hover:text-white">← Back to store</a>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 p-8 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminDashboardComponent {
  auth = inject(AuthService);

  navLinks = [
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/schedule', label: 'Schedule' },
    { path: '/admin/inventory', label: 'Inventory' },
  ];
}
