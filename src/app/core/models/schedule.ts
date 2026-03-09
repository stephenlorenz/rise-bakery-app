export interface ScheduleConfig {
  id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  is_open: boolean;
  pickup_start: string | null; // HH:MM:SS
  pickup_end: string | null;
  slot_interval_minutes: number;
}

export interface ScheduleOverride {
  id: string;
  date: string; // YYYY-MM-DD
  is_open: boolean;
  pickup_start: string | null;
  pickup_end: string | null;
  note: string | null;
}

export interface TimeSlot {
  time: string; // HH:MM
  label: string; // e.g. "2:30 PM"
}
