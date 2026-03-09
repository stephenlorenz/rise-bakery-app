import { Injectable, signal, computed, inject } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/order';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this.session());
  readonly isAdmin = computed(() => this.profile()?.is_admin ?? false);

  constructor() {
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      if (data.session?.user) this.loadProfile(data.session.user.id);
    });

    this.supabase.client.auth.onAuthStateChange((_, session) => {
      this.session.set(session);
      if (session?.user) {
        this.loadProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this.profile.set(data);
  }

  async signUp(email: string, password: string, fullName: string) {
    return this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  }

  async signIn(email: string, password: string) {
    return this.supabase.client.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.supabase.client.auth.signOut();
  }

  async updateProfile(updates: Partial<Pick<Profile, 'full_name'>>) {
    const userId = this.user()?.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (!error) this.profile.set(data);
    return { data, error };
  }
}
