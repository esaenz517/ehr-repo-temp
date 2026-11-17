import { useState } from "react";
import type { CheckIn, DeskAppointment, Patient } from "../../types";
import { Panel } from "../Panel";
import { formatClock } from "./format";

interface CheckInPanelProps {
  appointments: DeskAppointment[];
  patients: Patient[];
  queue: CheckIn[];
  onCheckIn: (patientId: number, appointmentId?: number | null) => Promise<boolean>;
}

// Today's appointments with a Check in button each, and a picker for walk-ins
// (existing patients who came in without an appointment).
export function CheckInPanel({ appointments, patients, queue, onCheckIn }: CheckInPanelProps) {
  const [walkIn, setWalkIn] = useState("");
  const [busy, setBusy] = useState<number | "walk-in" | null>(null);

  // Patients already in the queue can't be checked in again
  const inQueue = new Set(queue.map((c) => c.patient_id));
  const walkInChoices = patients
    .filter((p) => !inQueue.has(p.patient_id))
    .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));

  const checkInAppointment = async (a: DeskAppointment) => {
    setBusy(a.appointment_id);
    await onCheckIn(a.patient_id, a.appointment_id);
    setBusy(null);
  };

  const checkInWalkIn = async () => {
    setBusy("walk-in");
    if (await onCheckIn(Number(walkIn))) setWalkIn("");
    setBusy(null);
  };

  return (
    <Panel
      title="Check in"
      description="Today's appointments that haven't arrived yet."
      flush
      footer={
        <div className="helpdesk-walkin">
          <label className="helpdesk-walkin-label" htmlFor="helpdesk-walkin">Walk-in</label>
          <select
            id="helpdesk-walkin"
            className="ui-input"
            value={walkIn}
            onChange={(e) => setWalkIn(e.target.value)}
          >
            <option value="">Select an existing patient</option>
            {walkInChoices.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.last_name}, {p.first_name}{p.mrn ? ` · ${p.mrn}` : ""}
              </option>
            ))}
          </select>
          <button
            className="ui-button ui-button--small"
            disabled={!walkIn || busy !== null}
            onClick={checkInWalkIn}
          >
            Check in
          </button>
        </div>
      }
    >
      {appointments.length === 0 ? (
        <p className="ui-row-empty helpdesk-empty">No more appointments today.</p>
      ) : (
        <ul className="ui-row-list">
          {appointments.map((a) => (
            <li key={a.appointment_id} className="ui-row">
              <span className="helpdesk-time">{formatClock(a.appointment_time)}</span>
              <div className="ui-row-main">
                <div className="ui-row-title">{a.patient_name}</div>
                <div className="ui-row-subtitle">
                  {[a.mrn, a.location, a.provider_name && `Dr. ${a.provider_name}`].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="ui-row-actions">
                <button
                  className="ui-button ui-button--small"
                  disabled={busy !== null}
                  onClick={() => checkInAppointment(a)}
                >
                  Check in
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
