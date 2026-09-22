import type { Staff } from "../../types";

interface StaffListProps {
  staff: Staff[];
  onDelete: (staffId: number) => void;
}

export function StaffList({ staff, onDelete }: StaffListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {staff.map((member) => (
        <li
          key={member.staffid}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>
              {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}
              {member.last_name}
            </strong>
            <div style={{ fontSize: 14, color: "#555" }}>
              {member.specialization}
              {member.student && <> · Student</>}
              {member.admin && <> · Admin</>}
            </div>
          </div>
          <button onClick={() => onDelete(member.staffid)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
