import { useState } from "react";
import { useAppointments } from "../../hooks/useAppointments";

interface AppointmentPanelProps {
  patientId: number;
}

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
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 6,
      }}
    >
      <h3>Appointments</h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Date and Time:{" "}
            <input
              type="datetime-local"
              value={appointmentDatetime}
              onChange={(event) =>
                setAppointmentDatetime(event.target.value)
              }
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Location:{" "}
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Main Clinic"
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Status:{" "}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        <button type="submit">Add Appointment</button>
      </form>

      {loading && <p>Loading appointments...</p>}
      {error && <p>{error}</p>}

      {appointments.length === 0 && !loading ? (
        <p>No appointments.</p>
      ) : (
        <ul>
          {appointments.map((appointment) => (
            <li
              key={appointment.appointment_id}
              style={{ marginTop: 10 }}
            >
              <strong>
                {new Date(
                  appointment.appointment_datetime
                ).toLocaleString()}
              </strong>

              <div>Location: {appointment.location}</div>

              <div>
                Status:{" "}
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
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  removeAppointment(appointment.appointment_id)
                }
                style={{ marginTop: 6 }}
              >
                Delete Appointment
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}