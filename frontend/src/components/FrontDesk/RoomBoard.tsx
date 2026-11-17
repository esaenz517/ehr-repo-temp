import { useState } from "react";
import type { CheckIn, Room } from "../../types";
import { Panel } from "../Panel";
import { formatUtcClock, since } from "./format";

interface RoomBoardProps {
  rooms: Room[];
  roomed: CheckIn[];
  onDischarge: (checkInId: number) => Promise<boolean>;
}

// Every room with who is in it. Occupied rooms get a Discharge button.
export function RoomBoard({ rooms, roomed, onDischarge }: RoomBoardProps) {
  const [busy, setBusy] = useState<number | null>(null);
  const byRoom = new Map(roomed.filter((c) => c.room_id !== null).map((c) => [c.room_id as number, c]));

  const discharge = async (checkInId: number) => {
    setBusy(checkInId);
    await onDischarge(checkInId);
    setBusy(null);
  };

  return (
    <Panel title="Rooms">
      {rooms.length === 0 ? (
        <p className="ui-muted ui-flush">No rooms have been set up yet.</p>
      ) : (
        <ul className="frontdesk-rooms">
          {rooms.map((room) => {
            const stay = byRoom.get(room.room_id);
            const free = room.status === "available";
            return (
              <li key={room.room_id} className={`frontdesk-room${free ? "" : " frontdesk-room--occupied"}`}>
                <div className="frontdesk-room-header">
                  <span className="frontdesk-room-number">Room {room.room_number}</span>
                  <span className={free ? "ui-badge ui-badge--success" : "ui-badge ui-badge--solid"}>
                    {free ? "Available" : "Occupied"}
                  </span>
                </div>
                <p className="frontdesk-room-unit">{room.unit || "No unit"}</p>
                {!free && (
                  <div className="frontdesk-room-patient">
                    <span className="frontdesk-room-name">{stay?.patient_name ?? room.occupant_name ?? "Unknown patient"}</span>
                    {stay?.roomed_at && (
                      <span className="frontdesk-room-meta">
                        Since {formatUtcClock(stay.roomed_at)} · {since(stay.roomed_at)}
                      </span>
                    )}
                    {stay ? (
                      <button
                        className="ui-button ui-button--secondary ui-button--small frontdesk-room-discharge"
                        disabled={busy !== null}
                        onClick={() => discharge(stay.check_in_id)}
                      >
                        Discharge
                      </button>
                    ) : (
                      <span className="frontdesk-room-meta">Not from a check-in</span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
