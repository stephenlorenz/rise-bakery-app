import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-serif text-3xl text-[#3E2723]">Products</h1>
        <button
          (click)="openForm(null)"
          class="bg-[#B85C38] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9A4A2C] transition-colors"
        >
          + Add product
        </button>
      </div>

      @if (loading()) {
        <p class="text-[#8D7B68]">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-[#E8D5B7] overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-[#F5EFE6] text-[#3E2723] font-medium">
              <tr>
                <th class="px-4 py-3 text-left">Product</th>
                <th class="px-4 py-3 text-left">Price</th>
                <th class="px-4 py-3 text-left">Daily limit</th>
                <th class="px-4 py-3 text-left">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr class="border-t border-[#F5EFE6] hover:bg-[#FDFAF6]">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      @if (product.image_url) {
                        <img [src]="product.image_url" [alt]="product.name" class="w-10 h-10 rounded-lg object-cover" />
                      } @else {
                        <div class="w-10 h-10 rounded-lg bg-[#F5EFE6]"></div>
                      }
                      <span class="font-medium text-[#3E2723]">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-[#8D7B68]">{{ formatPrice(product.price_cents) }}</td>
                  <td class="px-4 py-3 text-[#8D7B68]">{{ product.daily_limit }}</td>
                  <td class="px-4 py-3">
                    <span [class]="product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
                          class="text-xs px-2 py-1 rounded-full font-medium">
                      {{ product.is_active ? 'Active' : 'Hidden' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right space-x-2">
                    <button (click)="openForm(product)" class="text-[#B85C38] hover:underline text-sm">Edit</button>
                    <button (click)="deleteProduct(product)" class="text-red-500 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 class="font-serif text-2xl text-[#3E2723] mb-5">
              {{ editingProduct() ? 'Edit product' : 'New product' }}
            </h2>

            <form (ngSubmit)="saveProduct()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[#3E2723] mb-1">Name *</label>
                <input type="text" [(ngModel)]="form.name" name="name" required
                  class="w-full px-3 py-2 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[#3E2723] mb-1">Description</label>
                <textarea [(ngModel)]="form.description" name="description" rows="3"
                  class="w-full px-3 py-2 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[#3E2723] mb-1">Price ($) *</label>
                  <input type="number" [(ngModel)]="form.priceUsd" name="price" step="0.01" min="0" required
                    class="w-full px-3 py-2 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#3E2723] mb-1">Daily limit</label>
                  <input type="number" [(ngModel)]="form.daily_limit" name="daily_limit" min="0"
                    class="w-full px-3 py-2 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-[#3E2723] mb-1">Display order</label>
                <input type="number" [(ngModel)]="form.display_order" name="display_order"
                  class="w-full px-3 py-2 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]" />
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="form.is_active" name="is_active" id="is_active"
                  class="rounded border-[#E8D5B7]" />
                <label for="is_active" class="text-sm text-[#3E2723]">Active (visible to customers)</label>
              </div>

              <!-- Image upload -->
              <div>
                <label class="block text-sm font-medium text-[#3E2723] mb-1">Product image</label>
                @if (form.image_url) {
                  <img [src]="form.image_url" alt="Product image" class="w-32 h-32 object-cover rounded-lg mb-2" />
                }
                <input type="file" accept="image/*" (change)="onFileChange($event)"
                  class="text-sm text-[#8D7B68]" />
                @if (uploadingImage()) {
                  <p class="text-xs text-[#8D7B68] mt-1">Uploading image…</p>
                }
              </div>

              @if (formError()) {
                <p class="text-red-600 text-sm">{{ formError() }}</p>
              }

              <div class="flex gap-3 pt-2">
                <button type="submit" [disabled]="saving() || uploadingImage()"
                  class="flex-1 bg-[#B85C38] text-white py-2.5 rounded-lg font-medium hover:bg-[#9A4A2C] transition-colors disabled:opacity-60">
                  {{ saving() ? 'Saving…' : 'Save product' }}
                </button>
                <button type="button" (click)="closeForm()"
                  class="flex-1 border border-[#E8D5B7] text-[#3E2723] py-2.5 rounded-lg font-medium hover:bg-[#F5EFE6] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);

  loading = signal(true);
  products = signal<Product[]>([]);
  showForm = signal(false);
  editingProduct = signal<Product | null>(null);
  saving = signal(false);
  uploadingImage = signal(false);
  formError = signal('');

  form = {
    name: '',
    description: '',
    priceUsd: 0,
    daily_limit: 10,
    display_order: 0,
    is_active: true,
    image_url: '',
  };

  async ngOnInit() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading.set(true);
    this.products.set(await this.productService.getAllProducts());
    this.loading.set(false);
  }

  openForm(product: Product | null) {
    this.editingProduct.set(product);
    this.formError.set('');
    if (product) {
      this.form = {
        name: product.name,
        description: product.description ?? '',
        priceUsd: product.price_cents / 100,
        daily_limit: product.daily_limit,
        display_order: product.display_order,
        is_active: product.is_active,
        image_url: product.image_url ?? '',
      };
    } else {
      this.form = { name: '', description: '', priceUsd: 0, daily_limit: 10, display_order: 0, is_active: true, image_url: '' };
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  async onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImage.set(true);
    try {
      this.form.image_url = await this.productService.uploadImage(file);
    } catch (e: any) {
      this.formError.set('Image upload failed: ' + e.message);
    } finally {
      this.uploadingImage.set(false);
    }
  }

  async saveProduct() {
    this.saving.set(true);
    this.formError.set('');
    try {
      const payload = {
        name: this.form.name,
        description: this.form.description || null,
        price_cents: Math.round(this.form.priceUsd * 100),
        daily_limit: this.form.daily_limit,
        display_order: this.form.display_order,
        is_active: this.form.is_active,
        image_url: this.form.image_url || null,
      };
      const editing = this.editingProduct();
      if (editing) {
        await this.productService.updateProduct(editing.id, payload);
      } else {
        await this.productService.createProduct(payload as any);
      }
      await this.loadProducts();
      this.closeForm();
    } catch (e: any) {
      this.formError.set(e.message ?? 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await this.productService.deleteProduct(product.id);
    await this.loadProducts();
  }

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }
}
