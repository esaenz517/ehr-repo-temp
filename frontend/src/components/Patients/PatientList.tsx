import type { Patient } from "../../types";

interface PatientListProps {
  patients: Patient[];
  onDelete: (patientId: number) => void;
}

export function PatientList({ patients, onDelete }: PatientListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {patients.map((patient) => (
        <li
          key={patient.patient_id}
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
              {patient.first_name} {patient.middle_name ? `${patient.middle_name} ` : ""}
              {patient.last_name}
            </strong>
            <div style={{ fontSize: 14, color: "#555" }}>
              {patient.mrn && <>MRN: {patient.mrn} · </>}
              DOB: {patient.date_of_birth}
              {patient.gender && <> · {patient.gender}</>}
              {" · "}
              {patient.status}
            </div>
          </div>
          <button onClick={() => onDelete(patient.patient_id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
