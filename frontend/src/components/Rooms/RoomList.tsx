import { useState } from "react";
import type { Patient, Room } from "../../types";

interface RoomListProps {
  rooms: Room[];
  availablePatients: Patient[];
  onDelete: (roomId: number) => void;
  onAssign: (roomId: number, patientId: number) => void;
  onUnassign: (roomId: number) => void;
}

// Displays every room. Available rooms get a patient dropdown + "Assign"
// button; occupied rooms get an "Unassign" button instead.
export function RoomList({ rooms, availablePatients, onDelete, onAssign, onUnassign }: RoomListProps) {
  // Tracks which patient is currently selected in each room's dropdown,
  // keyed by room_id (since every room has its own independent dropdown).
  const [selected, setSelected] = useState<Record<number, string>>({});

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {rooms.map((room) => (
        <li
          key={room.room_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>
              {room.room_number}
            </strong>
            <div style={{ fontSize: 14, color: "#555" }}>
              Unit: {room.unit}
              {" · "}
              Status: {room.status}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Only show the assign dropdown for rooms that are actually free */}
            {room.status === "available" ? (
              <>
                <select
                  value={selected[room.room_id] ?? ""}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [room.room_id]: e.target.value }))
                  }
                >
                  <option value="">Select patient</option>
                  {availablePatients.map((patient) => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.first_name} {patient.last_name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!selected[room.room_id]} // can't assign until a patient is picked
                  onClick={() => onAssign(room.room_id, Number(selected[room.room_id]))}
                >
                  Assign
                </button>
              </>
            ) : (
              // Room is occupied - only option is to discharge the current patient
              <button onClick={() => onUnassign(room.room_id)}>Unassign</button>
            )}
            <button onClick={() => onDelete(room.room_id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
