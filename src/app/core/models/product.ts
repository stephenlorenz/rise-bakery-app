export interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  daily_limit: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
