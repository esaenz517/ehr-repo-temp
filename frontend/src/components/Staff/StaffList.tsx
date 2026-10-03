import type { Staff } from "../../types";

interface StaffListProps {
  staff: Staff[];
  onDelete: (staffId: number) => void;
}

export function StaffList({ staff, onDelete }: StaffListProps) {
  if (staff.length === 0) {
    return <p className="ui-row-empty">No staff yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {staff.map((member) => (
        <li key={member.staffid} className="ui-row">
          <div className="ui-row-main">
            <div className="ui-row-title">
              {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}
              {member.last_name}
            </div>
            <div className="ui-row-subtitle">
              {member.specialization}
              {member.student && <> · Student</>}
              {member.admin && <> · Admin</>}
            </div>
          </div>
          <div className="ui-row-actions">
            <button className="ui-button ui-button--danger" onClick={() => onDelete(member.staffid)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
