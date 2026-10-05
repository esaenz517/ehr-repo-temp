import { RoomList } from "./Rooms/RoomList";
import { useRooms } from "../hooks/useRooms";
import "./Rooms/rooms.css";

// Pulls all rooms and their state
export function RoomsPage() {
    const { rooms, availablePatients, loading, error, create, remove, assign, unassign } = useRooms();

    return (
        <div className="rooms-page">
              <h1 className="rooms-title">Rooms</h1>

              {error && <p className="rooms-error">{error}</p>}
              {loading ? (
                <p className="rooms-muted">Loading...</p>
              ) : (
                <RoomList
                  rooms={rooms}
                  availablePatients={availablePatients}
                  onDelete={remove}
                  onAssign={assign}
                  onUnassign={unassign}
                  onCreate={create}
                />
              )}
            </div>
    )
}