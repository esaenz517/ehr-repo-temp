// Formatting shared by the patient portal pages.
export { formatUtc } from "../../api/clinicalNotes"; // vitals and labs are stored in UTC

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Amounts come back from the API as strings (e.g. "145.00")
export const formatMoney = (amount: string | number) => money.format(Number(amount));

// "YYYY-MM-DD" dates have no time; format them without a time zone shift.
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Appointment times are clinic-local times (same as the staff Appointments panel).
export function formatAppointment(value: string): { date: string; time: string } {
  const when = new Date(value);
  return {
    date: when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    time: when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

export const isUpcoming = (value: string, now = Date.now()) => new Date(value).getTime() >= now;

// Badge class for an appointment status
export function appointmentBadge(status: string): string {
  switch (status.toLowerCase()) {
    case "scheduled":
    case "confirmed":
      return "ui-badge";
    case "completed":
      return "ui-badge ui-badge--success";
    case "cancelled":
    case "canceled":
    case "no-show":
    case "no_show":
      return "ui-badge ui-badge--error";
    default:
      return "ui-badge ui-badge--muted";
  }
}

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, " ");

// Same rule as the chart: a lab flag other than "normal" means out of range.
export function isAbnormal(flag: string | null): boolean {
  const value = flag?.trim().toLowerCase() ?? "";
  return value !== "" && !["normal", "none", "n", "within range"].includes(value);
}
