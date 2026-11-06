import { portalApi } from "../../api/portal";
import { usePortal } from "../../hooks/usePortal";
import type { PortalAppointment } from "../../types";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import { appointmentBadge, capitalize, formatAppointment, isUpcoming } from "./format";
import "./portal.css";

// One appointment: date block, provider and place, status. Also used on the overview.
export function AppointmentRow({ appointment }: { appointment: PortalAppointment }) {
  const { date, time } = formatAppointment(appointment.appointment_datetime);
  const past = !isUpcoming(appointment.appointment_datetime);
  return (
    <li className={`ui-row portal-appointment${past ? " portal-appointment--past" : ""}`}>
      <span className="portal-when">
        <span className="portal-when-date">{date}</span>
        <span className="portal-when-time">{time}</span>
      </span>
      <div className="ui-row-main">
        <div className="ui-row-title">{appointment.provider_name ?? "Provider to be assigned"}</div>
        <div className="ui-row-subtitle">
          {appointment.location}
          {appointment.provider_specialty && <> · {appointment.provider_specialty}</>}
        </div>
      </div>
      <div className="ui-row-actions">
        <span className={appointmentBadge(appointment.status)}>{capitalize(appointment.status)}</span>
      </div>
    </li>
  );
}

// Upcoming visits first (soonest at the top), then past visits (most recent first).
export function PortalAppointments() {
  const { data, loading, error } = usePortal(portalApi.appointments);
  const appointments = data ?? [];
  const upcoming = appointments.filter((a) => isUpcoming(a.appointment_datetime));
  const past = appointments.filter((a) => !isUpcoming(a.appointment_datetime)).reverse();

  return (
    <div className="ui-page">
      <PageHeader title="Appointments" description="Your scheduled and past visits." />
      {error && <p className="ui-error">{error}</p>}

      <Panel title="Upcoming" flush>
        {loading ? (
          <p className="ui-row-empty">Loading appointments…</p>
        ) : upcoming.length === 0 ? (
          <p className="ui-row-empty">You have no upcoming appointments.</p>
        ) : (
          <ul className="ui-row-list">
            {upcoming.map((a) => <AppointmentRow key={a.appointment_id} appointment={a} />)}
          </ul>
        )}
      </Panel>

      <Panel title="Past visits" flush>
        {loading ? (
          <p className="ui-row-empty">Loading appointments…</p>
        ) : past.length === 0 ? (
          <p className="ui-row-empty">No past visits on file.</p>
        ) : (
          <ul className="ui-row-list">
            {past.map((a) => <AppointmentRow key={a.appointment_id} appointment={a} />)}
          </ul>
        )}
      </Panel>

      <p className="portal-footnote">To schedule, change, or cancel a visit, please contact your clinic.</p>
    </div>
  );
}
