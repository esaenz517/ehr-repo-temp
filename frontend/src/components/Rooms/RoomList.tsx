import type { Room } from "../../types";
import { confirmDelete } from "../confirmDelete";

interface RoomListProps {
  rooms: Room[];
  onDelete: (roomId: number) => void;
}

// Displays every room as a card with its status and who is in it.
// Patients are assigned to rooms from the Help Desk page, not here.
export function RoomList({ rooms, onDelete }: RoomListProps) {
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

            {/* Who is in the room. Patients are put in rooms (and discharged) from the Help Desk. */}
            <p className="rooms-card-occupant">
              {isAvailable ? "No patient" : room.occupant_name ?? "Occupied"}
              {!isAvailable && room.occupant_mrn && <span className="rooms-card-mrn"> · {room.occupant_mrn}</span>}
            </p>

            <div className="rooms-card-actions">
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
