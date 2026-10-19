import { StaffForm } from "./Staff/StaffForm";
import { StaffList } from "./Staff/StaffList";

import { StudentBatchImport } from "./Staff/StudentBatchImport";
import { StudentCreateForm } from "./Staff/StudentCreateForm";

import { useStaff } from "../hooks/useStaff";


interface StaffPageProps {
  canBatchImport?: boolean;
}


export function StaffPage({
  canBatchImport = false,
}: StaffPageProps) {
  const {
    staff,
    loading,
    error,
    create,
    remove,
    reload,
  } = useStaff();


  return (
    <div className="ui-page">
      <h1 className="ui-page-title">
        Staff Management
      </h1>

      {/* Student account management */}
      {canBatchImport && (
        <>
          <StudentCreateForm
            onCreated={reload}
          />

          <StudentBatchImport
            onImported={reload}
          />
        </>
      )}

      {/* Existing manual staff creation */}
      <h2>
        Add Staff Member
      </h2>

      <StaffForm
        onSubmit={create}
      />

      {/* Existing Staff listing */}
      <h2>
        Staff Directory
      </h2>

      {error && (
        <p className="ui-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="ui-muted">
          Loading...
        </p>
      ) : (
        <StaffList
          staff={staff}
          onDelete={remove}
        />
      )}
    </div>
  );
}