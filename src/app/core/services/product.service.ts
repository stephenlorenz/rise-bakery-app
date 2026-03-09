import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private supabase = inject(SupabaseService);

  async getActiveProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data ?? [];
  }

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .order('display_order');
    if (error) throw error;
    return data ?? [];
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await this.supabase.client.storage
      .from('product-images')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = this.supabase.client.storage
      .from('product-images')
      .getPublicUrl(path);
    return data.publicUrl;
  }

  /** Returns quantity already ordered for each product on a given date */
  async getDailyUsage(date: string): Promise<Record<string, number>> {
    const { data, error } = await this.supabase.client
      .from('order_items')
      .select('product_id, quantity, orders!inner(pickup_date, status)')
      .eq('orders.pickup_date', date)
      .neq('orders.status', 'cancelled');
    if (error) throw error;
    const usage: Record<string, number> = {};
    for (const row of data ?? []) {
      usage[row.product_id] = (usage[row.product_id] ?? 0) + row.quantity;
    }
    return usage;
  }
}
