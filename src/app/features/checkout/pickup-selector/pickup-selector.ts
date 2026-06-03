import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../../core/services/schedule.service';
import { TimeSlot } from '../../../core/models/schedule';

@Component({
  selector: 'app-pickup-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-[#1E2347] mb-2">Pickup date</label>
        @if (loadingDates()) {
          <div class="h-10 bg-[#C5CADF] rounded-lg animate-pulse"></div>
        } @else {
          <select
            [(ngModel)]="selectedDate"
            (ngModelChange)="onDateChange($event)"
            class="w-full px-4 py-2.5 border border-[#C5CADF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4557A7] bg-[#EDECE8]"
          >
            <option value="">Select a date</option>
            @for (d of availableDates(); track d.date) {
              <option [value]="d.date" [disabled]="!d.isOpen">
                {{ formatDate(d.date) }}{{ !d.isOpen ? ' (closed)' : '' }}
              </option>
            }
          </select>
        }
      </div>

      @if (selectedDate && slots().length > 0) {
        <div>
          <label class="block text-sm font-medium text-[#1E2347] mb-2">Pickup time</label>
          <div class="grid grid-cols-3 gap-2">
            @for (slot of slots(); track slot.time) {
              <button
                type="button"
                (click)="selectSlot(slot)"
                [class]="selectedSlot()?.time === slot.time
                  ? 'border-2 border-[#4557A7] bg-[#4557A7] text-white rounded-lg py-2 text-sm font-medium'
                  : 'border border-[#C5CADF] bg-white text-[#1E2347] rounded-lg py-2 text-sm hover:border-[#4557A7] transition-colors'"
              >
                {{ slot.label }}
              </button>
            }
          </div>
        </div>
      } @else if (selectedDate && slots().length === 0 && !loadingSlots()) {
        <p class="text-sm text-[#7279A5]">No pickup slots available for this date.</p>
      }
    </div>
  `,
})
export class PickupSelectorComponent implements OnInit {
  private scheduleService = inject(ScheduleService);

  @Output() selectionChange = new EventEmitter<{ date: string; time: string } | null>();

  availableDates = signal<{ date: string; isOpen: boolean }[]>([]);
  slots = signal<TimeSlot[]>([]);
  selectedDate = '';
  selectedSlot = signal<TimeSlot | null>(null);
  loadingDates = signal(true);
  loadingSlots = signal(false);

  async ngOnInit() {
    const dates = await this.scheduleService.getAvailableDates();
    this.availableDates.set(dates);
    this.loadingDates.set(false);
  }

  async onDateChange(date: string) {
    this.selectedSlot.set(null);
    this.selectionChange.emit(null);
    if (!date) return;
    this.loadingSlots.set(true);
    const slots = await this.scheduleService.getSlotsForDate(date);
    this.slots.set(slots);
    this.loadingSlots.set(false);
  }

  selectSlot(slot: TimeSlot) {
    this.selectedSlot.set(slot);
    this.selectionChange.emit({ date: this.selectedDate, time: slot.time });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}
