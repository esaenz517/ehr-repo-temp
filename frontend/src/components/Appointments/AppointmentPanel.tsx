import { useState } from "react";
import { useAppointments } from "../../hooks/useAppointments";
import "./appointments.css";

interface AppointmentPanelProps {
  patientId: number;
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Pieces of an appointment's date for the calendar tile and the text beside it
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", year: "numeric" });

export function AppointmentPanel({
  patientId,
}: AppointmentPanelProps) {
  const {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    removeAppointment,
  } = useAppointments(patientId);

  const [appointmentDatetime, setAppointmentDatetime] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("scheduled");

  // Soonest first
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime()
  );
  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!appointmentDatetime || !location.trim()) {
      return;
    }

    await createAppointment({
      appointment_datetime: appointmentDatetime,
      location: location.trim(),
      status,
    });

    setAppointmentDatetime("");
    setLocation("");
    setStatus("scheduled");
  };

  const handleStatusChange = async (
    appointmentId: number,
    appointmentDatetime: string,
    location: string,
    newStatus: string
  ) => {
    await updateAppointment(appointmentId, {
      appointment_datetime: appointmentDatetime,
      location,
      status: newStatus,
    });
  };

  return (
    <div className="appointments-panel">
      <div className="appointments-header">
        <h3 className="appointments-title">Appointments</h3>
        {scheduledCount > 0 && (
          <span className="appointments-count-badge">{scheduledCount} scheduled</span>
        )}
      </div>

      {error && <p className="ui-error">{error}</p>}

      {loading ? (
        <p className="appointments-muted">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="appointments-empty">No appointments yet.</p>
      ) : (
        <ul className="appointments-list">
          {sortedAppointments.map((appointment) => {
            const date = new Date(appointment.appointment_datetime);

            return (
              <li
                key={appointment.appointment_id}
                className={`appointments-item appointments-item--${appointment.status}`}
              >
                <div className="appointments-date" aria-hidden="true">
                  <span className="appointments-date-month">{monthFormat.format(date)}</span>
                  <span className="appointments-date-day">{date.getDate()}</span>
                </div>

                <div className="appointments-info">
                  {/* Full date for screen readers, since the tile is hidden from them */}
                  <div className="appointments-when">
                    <span className="ui-visually-hidden">{date.toLocaleDateString()} </span>
                    {timeFormat.format(date)} · {appointment.location}
                  </div>
                  <div className="appointments-where">{dayFormat.format(date)}</div>
                </div>

                <div className="appointments-actions">
                  <select
                    value={appointment.status}
                    onChange={(event) =>
                      handleStatusChange(
                        appointment.appointment_id,
                        appointment.appointment_datetime,
                        appointment.location,
                        event.target.value
                      )
                    }
                    aria-label="Appointment status"
                    className={`appointments-status appointments-status--${appointment.status}`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="ui-button ui-button--danger appointments-delete"
                    onClick={() => removeAppointment(appointment.appointment_id)}
                    aria-label={`Delete appointment on ${date.toLocaleString()}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="appointments-form">
        <div className="appointments-field appointments-field--datetime">
          <label htmlFor={`appointment-datetime-${patientId}`} className="appointments-label">
            Date and time
          </label>
          <input
            id={`appointment-datetime-${patientId}`}
            type="datetime-local"
            value={appointmentDatetime}
            onChange={(event) => setAppointmentDatetime(event.target.value)}
            required
            className="appointments-input"
          />
        </div>

        <div className="appointments-field appointments-field--location">
          <label htmlFor={`appointment-location-${patientId}`} className="appointments-label">
            Location
          </label>
          <input
            id={`appointment-location-${patientId}`}
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Main Clinic"
            required
            className="appointments-input"
          />
        </div>

        <div className="appointments-field appointments-field--status">
          <label htmlFor={`appointment-status-${patientId}`} className="appointments-label">
            Status
          </label>
          <select
            id={`appointment-status-${patientId}`}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="appointments-input"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="ui-button appointments-submit">Add appointment</button>
      </form>
    </div>
  );
}
