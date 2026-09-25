import { RoomForm } from "./Rooms/RoomForm";
import { RoomList } from "./Rooms/RoomList";
import { useRooms } from "../hooks/useRooms";

// Pulls all rooms and their state
export function RoomsPage() {
    const { rooms, availablePatients, loading, error, create, remove, assign, unassign } = useRooms();

    return (
        <div>
              <h1>Rooms</h1>

              <RoomForm onSubmit={create} />

              {error && <p style={{ color: "red" }}>{error}</p>}
              {loading ? (
                <p>Loading...</p>
              ) : (
                <RoomList
                  rooms={rooms}
                  availablePatients={availablePatients}
                  onDelete={remove}
                  onAssign={assign}
                  onUnassign={unassign}
                />
              )}
            </div>
    )
}