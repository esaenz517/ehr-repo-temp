import { useState } from "react";
import type { CheckIn, Room } from "../../types";
import { Panel } from "../Panel";
import { formatClock, formatUtcClock, since } from "./format";

interface WaitingPanelProps {
  waiting: CheckIn[];
  rooms: Room[];
  onAssign: (checkInId: number, roomId: number) => Promise<boolean>;
  onCancel: (checkInId: number) => Promise<boolean>;
}

// Checked-in patients without a room, longest wait first. Each row picks a free room.
export function WaitingPanel({ waiting, rooms, onAssign, onCancel }: WaitingPanelProps) {
  // Room picked in each row's dropdown, keyed by check-in id
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const freeRooms = rooms.filter((r) => r.status === "available");

  const act = async (checkInId: number, action: () => Promise<boolean>) => {
    setBusy(checkInId);
    if (await action()) setPicked(({ [checkInId]: _, ...rest }) => rest);
    setBusy(null);
  };

  return (
    <Panel
      title="Waiting room"
      description={freeRooms.length === 0 ? "No rooms are free right now." : `${freeRooms.length} room${freeRooms.length === 1 ? "" : "s"} free.`}
      flush
    >
      {waiting.length === 0 ? (
        <p className="ui-row-empty frontdesk-empty">Nobody is waiting.</p>
      ) : (
        <ul className="ui-row-list">
          {waiting.map((c) => (
            <li key={c.check_in_id} className="ui-row ui-row--wrap">
              <div className="ui-row-main">
                <div className="ui-row-title">{c.patient_name}</div>
                <div className="ui-row-subtitle">
                  {c.mrn && <>{c.mrn} · </>}
                  {c.appointment_time
                    ? <>Appointment {formatClock(c.appointment_time)}{c.location && <> · {c.location}</>}</>
                    : "Walk-in"}
                </div>
                {c.checked_in_at && (
                  <div className="ui-row-subtitle">
                    Checked in {formatUtcClock(c.checked_in_at)} · waiting {since(c.checked_in_at)}
                  </div>
                )}
              </div>
              <div className="ui-row-actions frontdesk-assign">
                <select
                  className="ui-input"
                  aria-label={`Room for ${c.patient_name}`}
                  value={picked[c.check_in_id] ?? ""}
                  disabled={freeRooms.length === 0}
                  onChange={(e) => setPicked((prev) => ({ ...prev, [c.check_in_id]: e.target.value }))}
                >
                  <option value="">Room</option>
                  {freeRooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.room_number}{r.unit ? ` · ${r.unit}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  className="ui-button ui-button--small"
                  disabled={!picked[c.check_in_id] || busy !== null}
                  onClick={() => act(c.check_in_id, () => onAssign(c.check_in_id, Number(picked[c.check_in_id])))}
                >
                  Assign
                </button>
                <button
                  className="ui-button ui-button--ghost ui-button--small"
                  disabled={busy !== null}
                  onClick={() => act(c.check_in_id, () => onCancel(c.check_in_id))}
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
