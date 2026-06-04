import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Profile } from '../../../core/models/order';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-serif text-3xl text-[#1E2347]">Users</h1>
        <input
          [(ngModel)]="search"
          placeholder="Search by name or email…"
          class="px-3 py-2 border border-[#C5CADF] rounded-lg text-sm bg-white text-[#1E2347] w-64 focus:outline-none focus:ring-2 focus:ring-[#4557A7]"
        />
      </div>

      @if (loading()) {
        <p class="text-[#7279A5]">Loading…</p>
      } @else if (error()) {
        <p class="text-red-600 text-sm">{{ error() }}</p>
      } @else if (filtered().length === 0) {
        <p class="text-[#7279A5]">No users found.</p>
      } @else {
        <div class="bg-white rounded-xl border border-[#C5CADF] overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[#C5CADF] bg-[#EDECE8] text-left text-xs uppercase tracking-wide text-[#7279A5]">
                <th class="px-5 py-3 font-medium">Name</th>
                <th class="px-5 py-3 font-medium">Email</th>
                <th class="px-5 py-3 font-medium">Joined</th>
                <th class="px-5 py-3 font-medium">Role</th>
                <th class="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filtered(); track user.id) {
                <tr class="border-b border-[#F5EFE6] last:border-0 hover:bg-[#EDECE8]/40 transition-colors">
                  <td class="px-5 py-3 font-medium text-[#1E2347]">
                    {{ user.full_name || '—' }}
                  </td>
                  <td class="px-5 py-3 text-[#7279A5]">{{ user.email || '—' }}</td>
                  <td class="px-5 py-3 text-[#7279A5]">{{ formatDate(user.created_at) }}</td>
                  <td class="px-5 py-3">
                    @if (user.is_admin) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#4557A7] text-white">
                        Admin
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDECE8] text-[#7279A5]">
                        Customer
                      </span>
                    }
                  </td>
                  <td class="px-5 py-3 text-right">
                    @if (isSelf(user)) {
                      <span class="text-xs text-[#7279A5] italic">You</span>
                    } @else if (toggling() === user.id) {
                      <span class="text-xs text-[#7279A5]">Saving…</span>
                    } @else {
                      <button
                        (click)="toggleAdmin(user)"
                        class="cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                        [class]="user.is_admin
                          ? 'border-red-300 text-red-600 hover:bg-red-50'
                          : 'border-[#4557A7] text-[#4557A7] hover:bg-[#4557A7]/10'"
                      >
                        {{ user.is_admin ? 'Remove admin' : 'Make admin' }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-[#7279A5]">{{ filtered().length }} of {{ users().length }} users</p>
      }
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  users = signal<Profile[]>([]);
  toggling = signal<string | null>(null);
  search = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  });

  async ngOnInit() {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.error.set('Failed to load users: ' + error.message);
    } else {
      this.users.set(data ?? []);
    }
    this.loading.set(false);
  }

  isSelf(user: Profile): boolean {
    return user.id === this.auth.user()?.id;
  }

  async toggleAdmin(user: Profile) {
    this.toggling.set(user.id);
    const newValue = !user.is_admin;
    const { error } = await this.supabase.client
      .from('profiles')
      .update({ is_admin: newValue })
      .eq('id', user.id);

    if (error) {
      this.error.set('Failed to update user: ' + error.message);
    } else {
      this.users.update((list) =>
        list.map((u) => (u.id === user.id ? { ...u, is_admin: newValue } : u))
      );
    }
    this.toggling.set(null);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
}
