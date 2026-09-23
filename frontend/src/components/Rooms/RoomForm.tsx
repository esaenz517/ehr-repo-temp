import { FormEvent, useState } from "react";
import type { CreateRoomInput } from "../../api/rooms";

interface RoomFormProps {
  onSubmit: (input: CreateRoomInput) => void;
}

export function RoomForm({ onSubmit }: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("available");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;
    onSubmit({ room_number: Number(roomNumber), unit, status });
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