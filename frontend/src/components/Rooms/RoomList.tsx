import type { Room } from "../../types";

interface RoomListProps {
    rooms: Room[];
    onDelete: (roomId: number) => void;
}

export function RoomList({ rooms, onDelete }: RoomListProps) {
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
          <button onClick={() => onDelete(room.room_id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
