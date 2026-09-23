import { RoomForm } from "./Rooms/RoomForm";
import { RoomList } from "./Rooms/RoomList";
import { useRooms } from "../hooks/useRooms";

export function RoomsPage() {
    const { rooms, loading, error, create, remove } = useRooms();

    return (
        <div>
              <h1>Rooms</h1>
        
              <RoomForm onSubmit={create} />
        
              {error && <p style={{ color: "red" }}>{error}</p>}
              {loading ? <p>Loading...</p> : <RoomList rooms={rooms} onDelete={remove} />}
            </div>
    )
}