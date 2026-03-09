import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);

  readonly count = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalCents = computed(() =>
    this.items().reduce(
      (sum, item) => sum + item.product.price_cents * item.quantity,
      0
    )
  );

  readonly isEmpty = computed(() => this.items().length === 0);

  addItem(product: Product, quantity = 1) {
    this.items.update((items) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...items, { product, quantity }];
    });
  }

  removeItem(productId: string) {
    this.items.update((items) => items.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this.items.update((items) =>
      items.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }

  clear() {
    this.items.set([]);
  }
}
