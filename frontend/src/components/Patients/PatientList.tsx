import { Fragment, useState } from "react";
import type { UpdatePatientInput } from "../../api/patients";
import type { Drug, Patient, Provider } from "../../types";
import { MedicalHistoryPanel } from "../MedicalHistory/MedicalHistoryPanel";
import { AppointmentPanel } from "../Appointments/AppointmentPanel";
import { BillingChargePanel } from "../Billing/BillingChargePanel";
import { confirmDelete } from "../confirmDelete";
import { PatientForm } from "./PatientForm";
import "./patients.css";

interface PatientListProps {
  patients: Patient[];
  emptyText: string; // shown when there are no rows (none yet, or none match the filters)
  providers: Provider[]; // options for the edit form
  drugs: Drug[];
  onUpdate: (patientId: number, changes: UpdatePatientInput) => Promise<boolean>;
  onDelete: (patientId: number) => void;
}

// Toggle buttons are outlined while closed and solid blue while their panel is open
const toggleClass = (open: boolean) =>
  open ? "ui-button ui-button--small" : "ui-button ui-button--secondary ui-button--small";

const COLUMN_COUNT = 6; // Patient, MRN, DOB, Status, Provider, actions; the detail row spans them all

// Displays every patient as a table row with what you scan for: name, MRN,
// date of birth, status, and provider. Details opens a panel under the row with
// the rest (identity, drugs) and the History / Appointments / Charges panels;
// Edit opens the full patient form there instead.
export function PatientList({ patients, emptyText, providers, drugs, onUpdate, onDelete }: PatientListProps) {
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [detailsPatientId, setDetailsPatientId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const [appointmentPatientId, setAppointmentPatientId] =
    useState<number | null>(null);

  const [billingPatientId, setBillingPatientId] =
    useState<number | null>(null);

  if (patients.length === 0) {
    return <p className="ui-row-empty">{emptyText}</p>;
  }

  return (
    <div className="ui-table-card ui-table-wrap">
      <table className="ui-table patients-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>MRN</th>
            <th>Date of birth</th>
            <th>Status</th>
            <th>Provider</th>
            <th><span className="ui-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => {
            const editing = editingPatientId === patient.patient_id;
            const detailsOpen = detailsPatientId === patient.patient_id;
            const historyOpen = selectedPatientId === patient.patient_id;
            const appointmentsOpen = appointmentPatientId === patient.patient_id;
            const chargesOpen = billingPatientId === patient.patient_id;
            const detailId = `patient-detail-${patient.patient_id}`;

            return (
              <Fragment key={patient.patient_id}>
                <tr className={editing || detailsOpen ? "patients-row patients-row--open" : "patients-row"}>
                  <td className="patients-name">
                    {[patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" ")}
                    {patient.preferred_name && (
                      <div className="patients-preferred">Goes by “{patient.preferred_name}”</div>
                    )}
                  </td>
                  <td className="patients-mrn" data-label="MRN">
                    {patient.mrn || <span className="ui-muted">—</span>}
                  </td>
                  <td className="patients-dob" data-label="DOB">{patient.date_of_birth}</td>
                  <td className="patients-status" data-label="Status">
                    <span className={`ui-badge${patient.status === "inpatient" ? "" : " ui-badge--muted"}`}>
                      {patient.status === "inpatient" ? "Inpatient" : "Outpatient"}
                    </span>
                  </td>
                  <td className="patients-provider" data-label="Provider">
                    {patient.provider ? (
                      `Dr. ${patient.provider.first_name} ${patient.provider.last_name}`
                    ) : (
                      <span className="ui-muted">None</span>
                    )}
                  </td>
                  <td className="patients-actions">
                    <div className="ui-row-actions">
                      <button
                        className={toggleClass(detailsOpen)}
                        aria-expanded={detailsOpen}
                        aria-controls={detailsOpen ? detailId : undefined}
                        onClick={() => {
                          setDetailsPatientId(detailsOpen ? null : patient.patient_id);
                          setEditingPatientId(null);
                        }}
                      >
                        {detailsOpen ? "Hide Details" : "Details"}
                      </button>
                      <button
                        className={toggleClass(editing)}
                        onClick={() => {
                          setEditingPatientId(editing ? null : patient.patient_id);
                          setDetailsPatientId(null);
                        }}
                      >
                        {editing ? "Close Edit" : "Edit"}
                      </button>
                      <button
                        className="ui-button ui-button--danger ui-button--small"
                        onClick={() => {
                          if (
                            confirmDelete(
                              `patient ${patient.first_name} ${patient.last_name}`,
                              `/patients/${patient.patient_id}`
                            )
                          ) {
                            onDelete(patient.patient_id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>

                {(editing || detailsOpen) && (
                  <tr className="patients-detail-row">
                    <td id={detailId} colSpan={COLUMN_COUNT}>
                      {editing ? (
                        <PatientForm
                          patient={patient}
                          providers={providers}
                          drugs={drugs}
                          onSubmit={async (input) => {
                            if (await onUpdate(patient.patient_id, input)) setEditingPatientId(null);
                          }}
                          onCancel={() => setEditingPatientId(null)}
                        />
                      ) : (
                        <>
                          <dl className="ui-detail-list patients-details">
                            <dt>Sex at birth</dt>
                            <dd>{patient.gender_at_birth ?? "—"}</dd>
                            <dt>Gender identity</dt>
                            <dd>{patient.gender_identity}</dd>
                            <dt>Pronouns</dt>
                            <dd>{patient.pronouns}</dd>
                            <dt>Drugs</dt>
                            <dd>{patient.drugs.length > 0 ? patient.drugs.map((d) => d.name).join(", ") : "None"}</dd>
                          </dl>

                          <div className="ui-row-actions patients-detail-actions">
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
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
