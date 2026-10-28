import { RoomList } from "./Rooms/RoomList";
import { useRooms } from "../hooks/useRooms";
import "./Rooms/rooms.css";

// Pulls all rooms and their state
export function RoomsPage() {
    const { rooms, availablePatients, loading, error, create, remove, assign, unassign } = useRooms();

    return (
        <div className="ui-page rooms-page">
              <h1 className="ui-page-title">Rooms</h1>

              {error && <p className="ui-error">{error}</p>}
              {loading ? (
                <p className="ui-muted">Loading...</p>
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