import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Order, OrderItem } from '../models/order';
import { CartItem } from '../models/product';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private supabase = inject(SupabaseService);

  async getMyOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*, product:products(name, image_url))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*, product:products(name, image_url)), customer:profiles(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getOrder(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*, product:products(name, image_url))')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  /** Called by the stripe-webhook edge function (service-role key), not directly from Angular */
  async createOrderFromPaymentIntent(
    customerId: string,
    pickupDate: string,
    pickupTime: string,
    totalCents: number,
    stripePaymentIntentId: string,
    items: CartItem[]
  ): Promise<Order> {
    const { data: order, error: orderError } = await this.supabase.client
      .from('orders')
      .insert({
        customer_id: customerId,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        total_cents: totalCents,
        stripe_payment_intent_id: stripePaymentIntentId,
        status: 'confirmed',
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price_cents: item.product.price_cents,
    }));

    const { error: itemsError } = await this.supabase.client
      .from('order_items')
      .insert(orderItems);
    if (itemsError) throw itemsError;

    return order;
  }
}
