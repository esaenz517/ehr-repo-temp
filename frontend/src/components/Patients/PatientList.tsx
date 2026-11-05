import { Fragment, useState } from "react";
import type { UpdatePatientInput } from "../../api/patients";
import type { Patient, Provider } from "../../types";
import { MedicalHistoryPanel } from "../MedicalHistory/MedicalHistoryPanel";
import { AppointmentPanel } from "../Appointments/AppointmentPanel";
import { BillingChargePanel } from "../Billing/BillingChargePanel";
import { InsurancePanel } from "../Insurance/InsurancePanel";
import { confirmDelete } from "../confirmDelete";
import { PatientForm } from "./PatientForm";
import "./patients.css";

interface PatientListProps {
  patients: Patient[];
  emptyText: string; // shown when there are no rows (none yet, or none match the filters)
  providers: Provider[]; // options for the edit form
  onUpdate: (patientId: number, changes: UpdatePatientInput) => Promise<boolean>;
  onDelete: (patientId: number) => void;
}

// Toggle buttons are outlined while closed and solid blue while their panel is open
const toggleClass = (open: boolean) =>
  open ? "ui-button ui-button--small" : "ui-button ui-button--secondary ui-button--small";

// Tabs inside a patient's Details panel
type DetailTab = "summary" | "history" | "appointments" | "charges" | "insurance";
const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "history", label: "Medical history" },
  { id: "appointments", label: "Appointments" },
  { id: "charges", label: "Charges" },
  { id: "insurance", label: "Insurance" },
];

const COLUMN_COUNT = 6; // Patient, MRN, DOB, Status, Provider, actions; the detail row spans them all

// Displays every patient as a table row with what you scan for: name, MRN,
// date of birth, status, and provider. Details opens a panel under the row with
// tabs for the summary (identity, drugs), history, appointments, charges and
// insurance; Edit opens the full patient form there instead.
export function PatientList({ patients, emptyText, providers, onUpdate, onDelete }: PatientListProps) {
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [detailsPatientId, setDetailsPatientId] = useState<number | null>(null);
  // Which tab is showing in the open Details panel (only one panel is open at a time)
  const [detailTab, setDetailTab] = useState<DetailTab>("summary");

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
                          setDetailTab("summary");
                          setEditingPatientId(null);
                        }}
                      >
                        {detailsOpen ? "Hide details" : "Details"}
                      </button>
                      <button
                        className={toggleClass(editing)}
                        onClick={() => {
                          setEditingPatientId(editing ? null : patient.patient_id);
                          setDetailsPatientId(null);
                        }}
                      >
                        {editing ? "Close edit" : "Edit"}
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
                          onSubmit={async (input) => {
                            if (await onUpdate(patient.patient_id, input)) setEditingPatientId(null);
                          }}
                          onCancel={() => setEditingPatientId(null)}
                        />
                      ) : (
                        <>
                          <div className="ui-tabs" role="tablist" aria-label="Patient details">
                            {DETAIL_TABS.map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={detailTab === tab.id}
                                className={`ui-tab${detailTab === tab.id ? " ui-tab--active" : ""}`}
                                onClick={() => setDetailTab(tab.id)}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="ui-tab-panel" role="tabpanel">
                            {detailTab === "summary" && (
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
                            )}
                            {detailTab === "history" && <MedicalHistoryPanel patientId={patient.patient_id} />}
                            {detailTab === "appointments" && <AppointmentPanel patientId={patient.patient_id} />}
                            {detailTab === "charges" && <BillingChargePanel patientId={patient.patient_id} />}
                            {detailTab === "insurance" && <InsurancePanel patientId={patient.patient_id} />}
                          </div>
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
