import { useState } from "react";
import type { CreateRoomInput } from "../../api/rooms";
import type { Patient, Room } from "../../types";
import { RoomForm } from "./RoomForm";

interface RoomListProps {
  rooms: Room[];
  availablePatients: Patient[];
  onDelete: (roomId: number) => void;
  onAssign: (roomId: number, patientId: number) => void;
  onUnassign: (roomId: number) => void;
  onCreate: (input: CreateRoomInput) => void;
}

// Displays every room as a card, with the "New room" form as the last card.
// Available rooms get a patient dropdown + "Assign" button; occupied rooms get
// an "Unassign" button instead.
export function RoomList({ rooms, availablePatients, onDelete, onAssign, onUnassign, onCreate }: RoomListProps) {
  // Tracks which patient is currently selected in each room's dropdown,
  // keyed by room_id (since every room has its own independent dropdown).
  const [selected, setSelected] = useState<Record<number, string>>({});

  return (
    <ul className="rooms-grid">
      {rooms.map((room) => {
        const isAvailable = room.status === "available";

        return (
          <li key={room.room_id} className="rooms-card">
            <div className="rooms-card-header">
              <div>
                <h2 className="rooms-card-number">Room {room.room_number}</h2>
                <p className="rooms-card-unit">Unit: {room.unit || "—"}</p>
              </div>
              <span className={`rooms-badge rooms-badge--${isAvailable ? "available" : "occupied"}`}>
                {room.status}
              </span>
            </div>

            <div className="rooms-card-actions">
              {/* Only show the assign dropdown for rooms that are actually free */}
              {isAvailable ? (
                <div className="rooms-card-assign">
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
                    className="rooms-button"
                    disabled={!selected[room.room_id]} // can't assign until a patient is picked
                    onClick={() => onAssign(room.room_id, Number(selected[room.room_id]))}
                  >
                    Assign
                  </button>
                </div>
              ) : (
                // Room is occupied - only option is to discharge the current patient
                <button
                  className="rooms-button rooms-button--secondary"
                  onClick={() => onUnassign(room.room_id)}
                >
                  Unassign
                </button>
              )}
              <button
                className="rooms-button rooms-button--danger"
                onClick={() => onDelete(room.room_id)}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}

      <li className="rooms-card">
        <RoomForm onSubmit={onCreate} />
      </li>
    </ul>
  );
}
