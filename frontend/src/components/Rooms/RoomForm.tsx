import { FormEvent, useState } from "react";
import type { CreateRoomInput } from "../../api/rooms";

interface RoomFormProps {
  onSubmit: (input: CreateRoomInput) => void;
}

// Form for creating a new room. Just collects input and hands it up to
// whatever onSubmit was passed in (RoomsPage wires this to useRooms().create).
export function RoomForm({ onSubmit }: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("available");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return; // require a room number before submitting
    onSubmit({ room_number: Number(roomNumber), unit, status });
    // clear the form for the next entry
    setRoomNumber("");
    setUnit("");
    setStatus("available");
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      <input
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        placeholder="Room number"
        type="number"
        style={{ flex: 1 }}
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Unit (optional)"
        style={{ flex: 2 }}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="available">available</option>
        <option value="occupied">occupied</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}