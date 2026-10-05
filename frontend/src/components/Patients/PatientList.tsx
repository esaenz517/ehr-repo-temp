import { useState } from "react";
import type { Patient } from "../../types";
import { MedicalHistoryPanel } from "../MedicalHistory/MedicalHistoryPanel";
import { AppointmentPanel } from "../Appointments/AppointmentPanel";
import { BillingChargePanel } from "../Billing/BillingChargePanel";

interface PatientListProps {
  patients: Patient[];
  onDelete: (patientId: number) => void;
}

// Toggle buttons are outlined while closed and solid blue while their panel is open
const toggleClass = (open: boolean) => (open ? "ui-button" : "ui-button ui-button--secondary");

export function PatientList({ patients, onDelete }: PatientListProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const [appointmentPatientId, setAppointmentPatientId] =
    useState<number | null>(null);

  const [billingPatientId, setBillingPatientId] =
    useState<number | null>(null);

  if (patients.length === 0) {
    return <p className="ui-row-empty">No patients yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {patients.map((patient) => {
        const historyOpen = selectedPatientId === patient.patient_id;
        const appointmentsOpen = appointmentPatientId === patient.patient_id;
        const chargesOpen = billingPatientId === patient.patient_id;

        return (
          <li key={patient.patient_id} className="ui-row ui-row--wrap">
            <div className="ui-row-main">
              <div className="ui-row-title">
                {patient.first_name} {patient.middle_name ? `${patient.middle_name} ` : ""}
                {patient.last_name}
                {patient.preferred_name && (
                  <span className="ui-muted"> ("{patient.preferred_name}")</span>
                )}
              </div>
              <div className="ui-row-subtitle">
                {patient.mrn && <>MRN: {patient.mrn} · </>}
                DOB: {patient.date_of_birth}
                {" · "}
                {patient.status}
              </div>
              <div className="ui-row-subtitle">
                Sex at birth: {patient.gender_at_birth ?? "—"} · Gender: {patient.gender_identity} · {patient.pronouns}
              </div>
              <div className="ui-row-subtitle">
                Provider:{" "}
                {patient.provider
                  ? `Dr. ${patient.provider.first_name} ${patient.provider.last_name}`
                  : "None"}
              </div>
              <div className="ui-row-subtitle">
                Drugs: {patient.drugs.length > 0 ? patient.drugs.map((d) => d.name).join(", ") : "None"}
              </div>
            </div>

            <div className="ui-row-actions">
              <button
                className={toggleClass(historyOpen)}
                onClick={() => setSelectedPatientId(historyOpen ? null : patient.patient_id)}
              >
                {historyOpen ? "Hide History" : "View History"}
              </button>

              <button
                className={toggleClass(appointmentsOpen)}
                onClick={() => setAppointmentPatientId(appointmentsOpen ? null : patient.patient_id)}
              >
                {appointmentsOpen ? "Hide Appointments" : "View Appointments"}
              </button>

              <button
                className={toggleClass(chargesOpen)}
                onClick={() => setBillingPatientId(chargesOpen ? null : patient.patient_id)}
              >
                {chargesOpen ? "Hide Charges" : "View Charges"}
              </button>

              <button
                className="ui-button ui-button--danger"
                onClick={() => onDelete(patient.patient_id)}
              >
                Delete
              </button>
            </div>

            {historyOpen && (
              <div className="ui-row-detail">
                <MedicalHistoryPanel patientId={patient.patient_id} />
              </div>
            )}
            {appointmentsOpen && (
              <div className="ui-row-detail">
                <AppointmentPanel patientId={patient.patient_id} />
              </div>
            )}
            {chargesOpen && (
              <div className="ui-row-detail">
                <BillingChargePanel patientId={patient.patient_id} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
