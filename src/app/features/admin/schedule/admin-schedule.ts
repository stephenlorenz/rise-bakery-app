import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ScheduleConfig, ScheduleOverride } from '../../../core/models/schedule';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl">
      <h1 class="font-serif text-3xl text-[#3E2723] mb-8">Pickup Schedule</h1>

      <!-- Weekly schedule -->
      <section class="bg-white rounded-xl border border-[#E8D5B7] p-6 mb-8">
        <h2 class="font-serif text-xl text-[#3E2723] mb-4">Weekly Hours</h2>
        @if (loading()) {
          <p class="text-[#8D7B68]">Loading…</p>
        } @else {
          <div class="space-y-3">
            @for (day of schedule(); track day.id) {
              <div class="flex items-center gap-4 py-2 border-b border-[#F5EFE6] last:border-0">
                <span class="w-24 text-sm font-medium text-[#3E2723]">{{ dayName(day.day_of_week) }}</span>
                <input type="checkbox" [(ngModel)]="day.is_open"
                  (ngModelChange)="saveDay(day)"
                  class="rounded border-[#E8D5B7]" />
                @if (day.is_open) {
                  <input type="time" [(ngModel)]="day.pickup_start"
                    (change)="saveDay(day)"
                    class="px-2 py-1 border border-[#E8D5B7] rounded text-sm bg-[#FAF7F2]" />
                  <span class="text-[#8D7B68] text-sm">to</span>
                  <input type="time" [(ngModel)]="day.pickup_end"
                    (change)="saveDay(day)"
                    class="px-2 py-1 border border-[#E8D5B7] rounded text-sm bg-[#FAF7F2]" />
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="day.slot_interval_minutes"
                      (change)="saveDay(day)"
                      min="5" max="60" step="5"
                      class="w-14 px-2 py-1 border border-[#E8D5B7] rounded text-sm bg-[#FAF7F2]" />
                    <span class="text-xs text-[#8D7B68]">min slots</span>
                  </div>
                } @else {
                  <span class="text-sm text-[#8D7B68]">Closed</span>
                }
              </div>
            }
          </div>
        }
      </section>

      <!-- Date overrides -->
      <section class="bg-white rounded-xl border border-[#E8D5B7] p-6">
        <h2 class="font-serif text-xl text-[#3E2723] mb-4">Date Overrides</h2>
        <p class="text-sm text-[#8D7B68] mb-4">Override the regular schedule for specific dates (holidays, special events, etc.)</p>

        <!-- Add override form -->
        <div class="bg-[#F5EFE6] rounded-lg p-4 mb-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-[#3E2723] mb-1">Date</label>
              <input type="date" [(ngModel)]="newOverride.date"
                class="w-full px-2 py-1.5 border border-[#E8D5B7] rounded text-sm bg-white" />
            </div>
            <div class="flex items-end gap-2">
              <input type="checkbox" [(ngModel)]="newOverride.is_open" id="override_open" class="rounded" />
              <label for="override_open" class="text-sm text-[#3E2723]">Open this day</label>
            </div>
          </div>
          @if (newOverride.is_open) {
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-[#3E2723] mb-1">Start</label>
                <input type="time" [(ngModel)]="newOverride.pickup_start"
                  class="w-full px-2 py-1.5 border border-[#E8D5B7] rounded text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-medium text-[#3E2723] mb-1">End</label>
                <input type="time" [(ngModel)]="newOverride.pickup_end"
                  class="w-full px-2 py-1.5 border border-[#E8D5B7] rounded text-sm bg-white" />
              </div>
            </div>
          }
          <div>
            <label class="block text-xs font-medium text-[#3E2723] mb-1">Note (optional)</label>
            <input type="text" [(ngModel)]="newOverride.note" placeholder="e.g. Closed for Thanksgiving"
              class="w-full px-2 py-1.5 border border-[#E8D5B7] rounded text-sm bg-white" />
          </div>
          <button (click)="addOverride()"
            class="bg-[#B85C38] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9A4A2C] transition-colors">
            Add override
          </button>
        </div>

        <!-- Existing overrides -->
        @if (overrides().length === 0) {
          <p class="text-sm text-[#8D7B68]">No overrides set.</p>
        } @else {
          <div class="space-y-2">
            @for (override of overrides(); track override.id) {
              <div class="flex items-center justify-between py-2 border-b border-[#F5EFE6] last:border-0">
                <div>
                  <p class="text-sm font-medium text-[#3E2723]">{{ formatDate(override.date) }}</p>
                  <p class="text-xs text-[#8D7B68]">
                    {{ override.is_open
                      ? 'Open ' + override.pickup_start + ' – ' + override.pickup_end
                      : 'Closed' }}
                    @if (override.note) { · {{ override.note }} }
                  </p>
                </div>
                <button (click)="deleteOverride(override)"
                  class="text-red-500 hover:text-red-700 text-sm">Remove</button>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class AdminScheduleComponent implements OnInit {
  private scheduleService = inject(ScheduleService);

  loading = signal(true);
  schedule = signal<ScheduleConfig[]>([]);
  overrides = signal<ScheduleOverride[]>([]);

  newOverride = {
    date: '',
    is_open: false,
    pickup_start: '09:00',
    pickup_end: '17:00',
    note: '',
  };

  async ngOnInit() {
    const [schedule, overrides] = await Promise.all([
      this.scheduleService.getWeeklySchedule(),
      this.scheduleService.getOverrides(
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
      ),
    ]);
    this.schedule.set(schedule);
    this.overrides.set(overrides);
    this.loading.set(false);
  }

  async saveDay(day: ScheduleConfig) {
    await this.scheduleService.updateDayConfig(day.id, {
      is_open: day.is_open,
      pickup_start: day.pickup_start,
      pickup_end: day.pickup_end,
      slot_interval_minutes: day.slot_interval_minutes,
    });
  }

  async addOverride() {
    if (!this.newOverride.date) return;
    await this.scheduleService.upsertOverride({
      date: this.newOverride.date,
      is_open: this.newOverride.is_open,
      pickup_start: this.newOverride.is_open ? this.newOverride.pickup_start : null,
      pickup_end: this.newOverride.is_open ? this.newOverride.pickup_end : null,
      note: this.newOverride.note || null,
    });
    const overrides = await this.scheduleService.getOverrides(
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    );
    this.overrides.set(overrides);
    this.newOverride = { date: '', is_open: false, pickup_start: '09:00', pickup_end: '17:00', note: '' };
  }

  async deleteOverride(override: ScheduleOverride) {
    await this.scheduleService.deleteOverride(override.id);
    this.overrides.update((o) => o.filter((x) => x.id !== override.id));
  }

  dayName(dow: number): string {
    return DAYS[dow];
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }
}
