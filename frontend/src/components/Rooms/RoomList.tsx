import { useState } from "react";
import type { Patient, Room } from "../../types";
import { confirmDelete } from "../confirmDelete";

interface RoomListProps {
  rooms: Room[];
  availablePatients: Patient[];
  onDelete: (roomId: number) => void;
  onAssign: (roomId: number, patientId: number) => void;
  onUnassign: (roomId: number) => void;
}

// Displays every room as a card.
// Available rooms get a patient dropdown + "Assign" button; occupied rooms get
// an "Unassign" button instead.
export function RoomList({ rooms, availablePatients, onDelete, onAssign, onUnassign }: RoomListProps) {
  // Tracks which patient is currently selected in each room's dropdown,
  // keyed by room_id (since every room has its own independent dropdown).
  const [selected, setSelected] = useState<Record<number, string>>({});

  if (rooms.length === 0) {
    return <p className="ui-row-empty">No rooms yet.</p>;
  }

  return (
    <ul className="rooms-grid">
      {rooms.map((room) => {
        const isAvailable = room.status === "available";

        return (
          <li key={room.room_id} className="rooms-card">
            <div className="rooms-card-header">
              <div>
                <h2 className="rooms-card-number">Room {room.room_number}</h2>
                <p className="rooms-card-unit">{room.unit ? `${room.unit} unit` : "No unit"}</p>
              </div>
              <span className={`ui-badge ${isAvailable ? "ui-badge--success" : "ui-badge--solid"} rooms-badge`}>
                {room.status}
              </span>
            </div>

            <div className="rooms-card-actions">
              {/* Only show the assign dropdown for rooms that are actually free */}
              {isAvailable ? (
                <div className="rooms-card-assign">
                  <select
                    className="ui-input"
                    aria-label={`Patient for room ${room.room_number}`}
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
                    className="ui-button ui-button--small"
                    disabled={!selected[room.room_id]} // can't assign until a patient is picked
                    onClick={() => onAssign(room.room_id, Number(selected[room.room_id]))}
                  >
                    Assign
                  </button>
                </div>
              ) : (
                // Room is occupied - only option is to discharge the current patient
                <button
                  className="ui-button ui-button--secondary ui-button--small"
                  onClick={() => onUnassign(room.room_id)}
                >
                  Unassign
                </button>
              )}
              <button
                className="ui-button ui-button--danger ui-button--small rooms-delete"
                onClick={() => {
                  if (confirmDelete(`room ${room.room_number}`, `/rooms/${room.room_id}`)) {
                    onDelete(room.room_id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}

    </ul>
  );
}
