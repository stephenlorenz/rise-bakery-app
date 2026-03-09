import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E8D5B7] p-8">
        <h1 class="font-serif text-3xl text-[#3E2723] mb-2">Welcome back</h1>
        <p class="text-[#8D7B68] mb-8">Sign in to your Rise Bakery account</p>

        @if (error()) {
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-[#3E2723] mb-1">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full px-4 py-2.5 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#3E2723] mb-1">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full px-4 py-2.5 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]"
            />
          </div>
          <button
            type="submit"
            [disabled]="loading()"
            class="w-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-[#8D7B68]">
          New customer?
          <a routerLink="/account/register" class="text-[#B85C38] hover:underline font-medium">Create account</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');
    const { error } = await this.auth.signIn(this.email, this.password);
    if (error) {
      this.error.set(error.message);
      this.loading.set(false);
    } else {
      this.router.navigate(['/']);
    }
  }
}
