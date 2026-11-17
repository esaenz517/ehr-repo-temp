import { useState } from "react";
import { useFrontDesk } from "../../hooks/useFrontDesk";
import { useProviders } from "../../hooks/useProviders";
import { PageHeader } from "../PageHeader";
import { PatientForm } from "../Patients/PatientForm";
import { CheckInPanel } from "./CheckInPanel";
import { RoomBoard } from "./RoomBoard";
import { WaitingPanel } from "./WaitingPanel";
import "./frontdesk.css";

// The front desk's page: check patients in (from today's appointments, as
// walk-ins, or by registering them), put waiting patients in rooms, and
// discharge them. Used by the front desk portal and by admins in the staff app.
export function FrontDeskBoard() {
  const desk = useFrontDesk();
  const { providers } = useProviders();
  const [registering, setRegistering] = useState(false); // the New patient form is open

  const waiting = desk.queue.filter((c) => c.status === "waiting");
  const roomed = desk.queue.filter((c) => c.status === "roomed");
  const freeRooms = desk.rooms.filter((r) => r.status === "available").length;

  return (
    <div className="ui-page frontdesk-page">
      <PageHeader
        title="Front Desk"
        description={`${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · Check patients in and put them in rooms.`}
        actions={
          <button className="ui-button" aria-expanded={registering} onClick={() => setRegistering((open) => !open)}>
            {registering ? "Close form" : "Register new patient"}
          </button>
        }
      />

      {registering && (
        <PatientForm
          providers={providers}
          onSubmit={async (input) => {
            if (await desk.registerAndCheckIn(input)) setRegistering(false);
          }}
          onCancel={() => setRegistering(false)}
        />
      )}

      {desk.error && <p className="ui-error" role="alert">{desk.error}</p>}
      {desk.notice && <p className="ui-alert ui-alert--success" role="status">{desk.notice}</p>}

      <section className="ui-stats" aria-label="Summary">
        <div className="ui-stat ui-stat--accent">
          <span className="ui-stat-value">{desk.loading ? "–" : waiting.length}</span>
          <span className="ui-stat-label">Waiting</span>
        </div>
        <div className="ui-stat ui-stat--info">
          <span className="ui-stat-value">{desk.loading ? "–" : roomed.length}</span>
          <span className="ui-stat-label">In a room</span>
        </div>
        <div className="ui-stat ui-stat--success">
          <span className="ui-stat-value">{desk.loading ? "–" : freeRooms}</span>
          <span className="ui-stat-label">Rooms free</span>
          {!desk.loading && <span className="ui-stat-meta">of {desk.rooms.length}</span>}
        </div>
        <div className="ui-stat ui-stat--muted">
          <span className="ui-stat-value">{desk.loading ? "–" : desk.appointments.length}</span>
          <span className="ui-stat-label">Still to arrive</span>
        </div>
      </section>

      {desk.loading ? (
        <p className="ui-row-empty">Loading the front desk…</p>
      ) : (
        <>
          <div className="frontdesk-columns">
            <CheckInPanel
              appointments={desk.appointments}
              patients={desk.patients}
              queue={desk.queue}
              onCheckIn={desk.checkIn}
            />
            <WaitingPanel
              waiting={waiting}
              rooms={desk.rooms}
              onAssign={desk.assignRoom}
              onCancel={desk.cancel}
            />
          </div>
          <RoomBoard rooms={desk.rooms} roomed={roomed} onDischarge={desk.discharge} />
        </>
      )}
    </div>
  );
}
