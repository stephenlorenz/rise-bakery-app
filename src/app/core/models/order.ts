export type OrderStatus = 'pending_payment' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer_id: string;
  pickup_date: string;
  pickup_time: string;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  total_cents: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  product?: { name: string; image_url: string | null };
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
}
