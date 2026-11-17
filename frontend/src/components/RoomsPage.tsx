import { useState } from "react";
import { RoomForm } from "./Rooms/RoomForm";
import { RoomList } from "./Rooms/RoomList";
import { useRooms } from "../hooks/useRooms";
import { PageHeader } from "./PageHeader";
import "./Rooms/rooms.css";

// Pulls all rooms and their state
export function RoomsPage() {
  const { rooms, loading, error, create, remove } = useRooms();
  const [adding, setAdding] = useState(false); // the New room form is open

  const occupied = rooms.filter((r) => r.status !== "available").length;

  return (
    <div className="ui-page rooms-page">
      <PageHeader
        title="Rooms"
        description={
          loading
            ? "Set up rooms. Patients are put in rooms from the Help Desk."
            : `${rooms.length - occupied} of ${rooms.length} room${rooms.length === 1 ? "" : "s"} available.`
        }
        actions={
          <button className="ui-button" aria-expanded={adding} onClick={() => setAdding((open) => !open)}>
            {adding ? "Close form" : "New room"}
          </button>
        }
      />

      {adding && <RoomForm onSubmit={create} onCancel={() => setAdding(false)} />}

      {error && <p className="ui-error">{error}</p>}
      {loading ? (
        <p className="ui-row-empty">Loading rooms…</p>
      ) : (
        <RoomList
          rooms={rooms}
          onDelete={remove}
        />
      )}
    </div>
  );
}
