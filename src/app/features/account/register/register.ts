import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E8D5B7] p-8">
        <h1 class="font-serif text-3xl text-[#3E2723] mb-2">Create account</h1>
        <p class="text-[#8D7B68] mb-8">Join Rise Bakery to place orders</p>

        @if (error()) {
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ error() }}
          </div>
        }
        @if (success()) {
          <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Check your email to confirm your account!
          </div>
        }

        <form (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-[#3E2723] mb-1">Full name</label>
            <input
              type="text"
              [(ngModel)]="fullName"
              name="fullName"
              required
              class="w-full px-4 py-2.5 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]"
            />
          </div>
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
              minlength="8"
              class="w-full px-4 py-2.5 border border-[#E8D5B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38] bg-[#FAF7F2]"
            />
          </div>
          <button
            type="submit"
            [disabled]="loading() || success()"
            class="w-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-[#8D7B68]">
          Already have an account?
          <a routerLink="/account/login" class="text-[#B85C38] hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  success = signal(false);

  async submit() {
    this.loading.set(true);
    this.error.set('');
    const { error } = await this.auth.signUp(this.email, this.password, this.fullName);
    if (error) {
      this.error.set(error.message);
      this.loading.set(false);
    } else {
      this.success.set(true);
      this.loading.set(false);
    }
  }
}
