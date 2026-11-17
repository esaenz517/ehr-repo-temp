// Time formatting for the help desk board.

// Appointment times are clinic-local (no time zone), so they parse as local time.
export const formatClock = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// Check-in and room times are stored in UTC without an offset.
export const parseUtc = (value: string) =>
  new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`);

export const formatUtcClock = (value: string) =>
  parseUtc(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// "Just now", "12 min", "1 h 05 min"
export function since(value: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - parseUtc(value).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)} d`;
  return `${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
}
