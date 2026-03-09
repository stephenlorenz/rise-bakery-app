import { Component, inject, signal, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  template: `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="font-serif text-4xl text-[#3E2723] mb-8">My Orders</h1>

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-xl border border-[#E8D5B7] p-5 animate-pulse">
              <div class="h-5 bg-[#E8D5B7] rounded w-1/3 mb-3"></div>
              <div class="h-4 bg-[#E8D5B7] rounded w-1/2"></div>
            </div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-20">
          <p class="text-[#8D7B68] text-lg">No orders yet. Place your first order!</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <div class="bg-white rounded-xl border border-[#E8D5B7] overflow-hidden">
              <div class="p-5 flex items-center justify-between">
                <div>
                  <p class="font-medium text-[#3E2723]">
                    {{ formatDate(order.pickup_date) }} at {{ formatTime(order.pickup_time) }}
                  </p>
                  <p class="text-sm text-[#8D7B68] mt-1">{{ formatPrice(order.total_cents) }}</p>
                </div>
                <span [class]="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
              </div>

              @if (order.order_items && order.order_items.length > 0) {
                <div class="border-t border-[#F5EFE6] px-5 py-3">
                  @for (item of order.order_items; track item.id) {
                    <div class="flex justify-between text-sm py-1">
                      <span class="text-[#3E2723]">{{ item.product?.name ?? 'Item' }} × {{ item.quantity }}</span>
                      <span class="text-[#8D7B68]">{{ formatPrice(item.unit_price_cents * item.quantity) }}</span>
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
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  loading = signal(true);
  orders = signal<Order[]>([]);

  async ngOnInit() {
    const orders = await this.orderService.getMyOrders();
    this.orders.set(orders);
    this.loading.set(false);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric',
    });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
  }

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_payment: 'Pending Payment',
      confirmed: 'Confirmed',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const base = 'text-xs font-medium px-3 py-1 rounded-full';
    const map: Record<string, string> = {
      pending_payment: `${base} bg-yellow-50 text-yellow-700`,
      confirmed: `${base} bg-blue-50 text-blue-700`,
      ready: `${base} bg-green-50 text-green-700`,
      completed: `${base} bg-gray-100 text-gray-600`,
      cancelled: `${base} bg-red-50 text-red-700`,
    };
    return map[status] ?? `${base} bg-gray-100 text-gray-600`;
  }
}
