export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DaySlot = {
  day: Weekday;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type Availability = {
  freelancerId: string;
  timezone: string;
  slots: DaySlot[];
};

export const WEEK_DAYS: { key: Weekday; label: string; short: string }[] = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

export const CALENDAR_HOUR_START = 8;
export const CALENDAR_HOUR_END = 20;

export const parseHour = (time: string) => {
  const [h] = time.split(":").map(Number);
  return Number.isFinite(h) ? h : CALENDAR_HOUR_START;
};

export const formatHour = (hour: number) =>
  `${hour.toString().padStart(2, "0")}:00`;

export const isHourInSlot = (hour: number, slot: DaySlot) => {
  if (!slot.enabled) return false;
  const start = parseHour(slot.startTime);
  const end = parseHour(slot.endTime);
  return hour >= start && hour < end;
};

export const formatHourLabel = (hour: number) => {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};

export type ExceptionKind = "blocked" | "custom";

export type AvailabilityException = {
  _id?: string;
  date: string;
  kind: ExceptionKind;
  startTime?: string;
  endTime?: string;
  note?: string;
};

export const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const toMonthKey = (year: number, monthIndex: number) => {
  const m = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${m}`;
};

export const buildMonthGrid = (year: number, monthIndex: number) => {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mondayBasedStart = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ date: Date | null; key: string | null }> = [];
  for (let i = 0; i < mondayBasedStart; i += 1) {
    cells.push({ date: null, key: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({ date, key: toDateKey(date) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: null });
  }
  return cells;
};

export const getCurrentWeekDates = () => {
  const today = new Date();
  const dayIndex = today.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + mondayOffset);

  return WEEK_DAYS.map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
};

export const defaultDaySlots = (): DaySlot[] =>
  WEEK_DAYS.map(({ key }) => ({
    day: key,
    enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(key),
    startTime: "09:00",
    endTime: "17:00",
  }));
