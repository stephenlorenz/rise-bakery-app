import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ScheduleConfig, ScheduleOverride, TimeSlot } from '../models/schedule';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private supabase = inject(SupabaseService);

  async getWeeklySchedule(): Promise<ScheduleConfig[]> {
    const { data, error } = await this.supabase.client
      .from('schedule_config')
      .select('*')
      .order('day_of_week');
    if (error) throw error;
    return data ?? [];
  }

  async updateDayConfig(id: string, updates: Partial<ScheduleConfig>): Promise<void> {
    const { error } = await this.supabase.client
      .from('schedule_config')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }

  async getOverrides(fromDate: string, toDate: string): Promise<ScheduleOverride[]> {
    const { data, error } = await this.supabase.client
      .from('schedule_overrides')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date');
    if (error) throw error;
    return data ?? [];
  }

  async upsertOverride(override: Omit<ScheduleOverride, 'id'>): Promise<void> {
    const { error } = await this.supabase.client
      .from('schedule_overrides')
      .upsert(override, { onConflict: 'date' });
    if (error) throw error;
  }

  async deleteOverride(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('schedule_overrides')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  /** Returns all available dates in the next 30 days with open status */
  async getAvailableDates(): Promise<{ date: string; isOpen: boolean }[]> {
    const schedule = await this.getWeeklySchedule();
    const today = new Date();
    const results: { date: string; isOpen: boolean }[] = [];

    // Fetch overrides for next 30 days
    const toDate = new Date(today);
    toDate.setDate(toDate.getDate() + 30);
    const overrides = await this.getOverrides(
      today.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    );
    const overrideMap = new Map(overrides.map((o) => [o.date, o]));

    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dow = d.getDay();

      const override = overrideMap.get(dateStr);
      if (override) {
        results.push({ date: dateStr, isOpen: override.is_open });
      } else {
        const config = schedule.find((s) => s.day_of_week === dow);
        results.push({ date: dateStr, isOpen: config?.is_open ?? false });
      }
    }
    return results;
  }

  /** Generates 15-min time slots between pickup_start and pickup_end */
  getTimeSlots(pickupStart: string, pickupEnd: string, intervalMinutes = 15): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startH, startM] = pickupStart.split(':').map(Number);
    const [endH, endM] = pickupEnd.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      slots.push({ time, label });
      current += intervalMinutes;
    }
    return slots;
  }

  async getSlotsForDate(date: string): Promise<TimeSlot[]> {
    const dow = new Date(date + 'T00:00:00').getDay();
    const [schedule, overrides] = await Promise.all([
      this.getWeeklySchedule(),
      this.getOverrides(date, date),
    ]);

    const override = overrides.find((o) => o.date === date);
    const config = schedule.find((s) => s.day_of_week === dow);

    const src = override ?? config;
    if (!src?.is_open || !src.pickup_start || !src.pickup_end) return [];

    const interval = (config as ScheduleConfig)?.slot_interval_minutes ?? 15;
    return this.getTimeSlots(src.pickup_start, src.pickup_end, interval);
  }
}
