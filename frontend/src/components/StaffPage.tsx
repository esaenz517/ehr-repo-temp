import { StaffForm } from "./Staff/StaffForm";
import { StaffList } from "./Staff/StaffList";
import { useStaff } from "../hooks/useStaff";

export function StaffPage() {
  const { staff, loading, error, create, remove } = useStaff();

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Staff</h1>

      <StaffForm onSubmit={create} />

      {error && <p className="ui-error">{error}</p>}
      {loading ? <p className="ui-muted">Loading...</p> : <StaffList staff={staff} onDelete={remove} />}
    </div>
  );
}
