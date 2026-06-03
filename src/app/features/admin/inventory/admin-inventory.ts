import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-serif text-3xl text-[#1E2347]">Daily Inventory</h1>
        <div>
          <label class="text-sm text-[#7279A5] mr-2">Date</label>
          <input type="date" [(ngModel)]="selectedDate" (ngModelChange)="loadInventory()"
            class="px-3 py-1.5 border border-[#C5CADF] rounded-lg text-sm bg-[#EDECE8]" />
        </div>
      </div>

      @if (loading()) {
        <p class="text-[#7279A5]">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-[#C5CADF] overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-[#F5EFE6] text-[#1E2347] font-medium">
              <tr>
                <th class="px-4 py-3 text-left">Product</th>
                <th class="px-4 py-3 text-center">Daily Limit</th>
                <th class="px-4 py-3 text-center">Ordered</th>
                <th class="px-4 py-3 text-center">Remaining</th>
                <th class="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (row of inventory(); track row.product.id) {
                <tr class="border-t border-[#F5EFE6]">
                  <td class="px-4 py-3 font-medium text-[#1E2347]">{{ row.product.name }}</td>
                  <td class="px-4 py-3 text-center text-[#7279A5]">{{ row.product.daily_limit }}</td>
                  <td class="px-4 py-3 text-center text-[#1E2347]">{{ row.ordered }}</td>
                  <td class="px-4 py-3 text-center font-medium"
                      [class]="row.remaining <= 0 ? 'text-red-600' : row.remaining <= 2 ? 'text-yellow-600' : 'text-green-600'">
                    {{ row.remaining }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (row.remaining <= 0) {
                      <span class="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium">Sold out</span>
                    } @else if (row.remaining <= 2) {
                      <span class="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">Low stock</span>
                    } @else {
                      <span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Available</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminInventoryComponent implements OnInit {
  private productService = inject(ProductService);

  loading = signal(true);
  selectedDate = new Date().toISOString().split('T')[0];
  inventory = signal<{ product: Product; ordered: number; remaining: number }[]>([]);

  async ngOnInit() {
    await this.loadInventory();
  }

  async loadInventory() {
    this.loading.set(true);
    const [products, usage] = await Promise.all([
      this.productService.getAllProducts(),
      this.productService.getDailyUsage(this.selectedDate),
    ]);
    this.inventory.set(
      products.map((p) => ({
        product: p,
        ordered: usage[p.id] ?? 0,
        remaining: Math.max(0, p.daily_limit - (usage[p.id] ?? 0)),
      }))
    );
    this.loading.set(false);
  }
}
