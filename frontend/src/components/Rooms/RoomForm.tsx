import { FormEvent, useState } from "react";
import type { CreateRoomInput } from "../../api/rooms";

interface RoomFormProps {
  onSubmit: (input: CreateRoomInput) => void;
}

// Form for creating a new room, laid out to match a room card (RoomList renders
// it as the last card in the grid). Just collects input and hands it up to
// whatever onSubmit was passed in (RoomsPage wires this to useRooms().create).
// New rooms always start "available"; status changes through Assign/Unassign.
export function RoomForm({ onSubmit }: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState("");
  const [unit, setUnit] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return; // require a room number before submitting
    onSubmit({ room_number: Number(roomNumber), unit: unit.trim(), status: "available" });
    // clear the form for the next entry
    setRoomNumber("");
    setUnit("");
  };

  return (
    <form onSubmit={handleSubmit} className="rooms-form">
      <h2 className="rooms-card-number">New room</h2>
      <input
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        placeholder="Room number"
        aria-label="Room number"
        type="number"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Unit"
        aria-label="Unit"
      />
      <div className="rooms-card-actions">
        <button type="submit" className="rooms-button">Add room</button>
      </div>
    </form>
  );
}
