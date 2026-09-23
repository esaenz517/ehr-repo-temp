import { StaffForm } from "./Staff/StaffForm";
import { StaffList } from "./Staff/StaffList";
import { useStaff } from "../hooks/useStaff";

export function StaffPage() {
  const { staff, loading, error, create, remove } = useStaff();

  return (
    <div>
      <h1>Staff</h1>

      <StaffForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <StaffList staff={staff} onDelete={remove} />}
    </div>
  );
}
