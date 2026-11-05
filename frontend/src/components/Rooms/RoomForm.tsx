import { FormEvent, useState } from "react";
import type { CreateRoomInput } from "../../api/rooms";

interface RoomFormProps {
  onSubmit: (input: CreateRoomInput) => void;
  onCancel?: () => void; // shows a Cancel button that closes the form
}

// Form for creating a new room, opened from the Rooms page header. Just collects
// input and hands it up to whatever onSubmit was passed in (RoomsPage wires this
// to useRooms().create).
// New rooms always start "available"; status changes through Assign/Unassign.
export function RoomForm({ onSubmit, onCancel }: RoomFormProps) {
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
    <form onSubmit={handleSubmit} className="ui-panel" aria-label="New room">
      <header className="ui-panel-header">
        <div className="ui-panel-heading">
          <h2 className="ui-panel-title">New room</h2>
          <p className="ui-panel-description">New rooms start out available.</p>
        </div>
      </header>

      <div className="ui-panel-body">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="room-number">
              Room number<span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="room-number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              type="number"
              required
              className="ui-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="room-unit">Unit</label>
            <input
              id="room-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. ICU"
              className="ui-input"
            />
          </div>
        </div>
      </div>

      <div className="ui-panel-footer">
        {onCancel && (
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-button">Add room</button>
      </div>
    </form>
  );
}
