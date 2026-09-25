import { useState } from "react";
import type { Patient } from "../../types";
import { MedicalHistoryPanel } from "../MedicalHistory/MedicalHistoryPanel";

interface PatientListProps {
  patients: Patient[];
  onDelete: (patientId: number) => void;
}

export function PatientList({ patients, onDelete }: PatientListProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {patients.map((patient) => (
        <li
          key={patient.patient_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
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
            <div style={{ fontSize: 14, color: "#555" }}>
              Provider:{" "}
              {patient.provider
                ? `Dr. ${patient.provider.first_name} ${patient.provider.last_name}`
                : "None"}
            </div>
            <div style={{ fontSize: 14, color: "#555" }}>
              Drugs: {patient.drugs.length > 0 ? patient.drugs.map((d) => d.name).join(", ") : "None"}
            </div>
          </div>

          <div>
            <button
              onClick={() =>
                setSelectedPatientId(
                  selectedPatientId === patient.patient_id ? null : patient.patient_id
                )
              }
            >
              {selectedPatientId === patient.patient_id ? "Hide History" : "View History"}
            </button>

            <button
              onClick={() => onDelete(patient.patient_id)}
               style={{ marginLeft: 8 }}
            >
               Delete
            </button>
          </div>
          {selectedPatientId === patient.patient_id && (
            <div style={{ width: "100%" }}>
              <MedicalHistoryPanel patientId={patient.patient_id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
