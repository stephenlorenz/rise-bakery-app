import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-serif text-3xl text-[#3E2723]">Orders</h1>
        <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()"
          class="px-3 py-2 border border-[#E8D5B7] rounded-lg text-sm bg-[#FAF7F2] text-[#3E2723]">
          <option value="">All statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      @if (loading()) {
        <p class="text-[#8D7B68]">Loading…</p>
      } @else if (filtered().length === 0) {
        <p class="text-[#8D7B68]">No orders found.</p>
      } @else {
        <div class="space-y-4">
          @for (order of filtered(); track order.id) {
            <div class="bg-white rounded-xl border border-[#E8D5B7] overflow-hidden">
              <div class="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p class="font-medium text-[#3E2723]">
                    {{ formatDate(order.pickup_date) }} at {{ formatTime(order.pickup_time) }}
                  </p>
                  <p class="text-sm text-[#8D7B68]">
                    {{ getCustomerLabel(order) }} · {{ formatPrice(order.total_cents) }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <select
                    [ngModel]="order.status"
                    (ngModelChange)="updateStatus(order, $event)"
                    class="px-3 py-1.5 border border-[#E8D5B7] rounded-lg text-sm bg-[#FAF7F2]"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              @if (order.order_items && order.order_items.length > 0) {
                <div class="border-t border-[#F5EFE6] px-4 py-3">
                  @for (item of order.order_items; track item.id) {
                    <div class="flex justify-between text-sm py-0.5 text-[#8D7B68]">
                      <span>{{ item.product?.name ?? 'Item' }} × {{ item.quantity }}</span>
                      <span>{{ formatPrice(item.unit_price_cents * item.quantity) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  loading = signal(true);
  orders = signal<Order[]>([]);
  filtered = signal<Order[]>([]);
  statusFilter = '';

  async ngOnInit() {
    const orders = await this.orderService.getAllOrders();
    this.orders.set(orders);
    this.filtered.set(orders);
    this.loading.set(false);
  }

  applyFilter() {
    const f = this.statusFilter;
    this.filtered.set(f ? this.orders().filter((o) => o.status === f) : this.orders());
  }

  async updateStatus(order: Order, status: Order['status']) {
    await this.orderService.updateOrderStatus(order.id, status);
    this.orders.update((orders) =>
      orders.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
    this.applyFilter();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
  }

  getCustomerLabel(order: any): string {
    return order.customer?.full_name || order.customer?.email || 'Customer';
  }

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }
}
