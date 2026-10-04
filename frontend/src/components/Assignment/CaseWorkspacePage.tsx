import { ReactNode, useEffect, useState } from "react";
import { casesApi } from "../../api/cases";
import { clinicalNotesApi, formatUtc } from "../../api/clinicalNotes";
import type { ChartContext } from "../../api/clinicalNotes";
import type { Assignment, Case } from "../../types";
import { ClinicalNotesPage } from "../ClinicalNotes/ClinicalNotesPage";
import { MedicalHistoryPanel } from "../MedicalHistory/MedicalHistoryPanel";

// One boxed section of the form, with its title in the border.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset style={{ border: "1px solid #ddd", borderRadius: 4, marginBottom: 16, padding: 16 }}>
      <legend style={{ fontWeight: 600, padding: "0 4px" }}>{title}</legend>
      {children}
    </fieldset>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
    return (
      <div style={{ marginBottom: 4 }}>
        <strong>{label}:</strong> {value ?? "—"}
      </div>
    );
  }
  
// A section that stays closed until the student clicks it open to work on it.
function WorkSection({ title, children }: { title: string; children: ReactNode }) {
const [open, setOpen] = useState(false);
return (
    <Section title={title}>
    <button type="button" onClick={() => setOpen((o) => !o)}>
        {open ? `Close ${title.toLowerCase()}` : `Open ${title.toLowerCase()}`}
    </button>
    {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </Section>
);
}

interface CaseWorkspacePageProps {
  assignment: Assignment;
  onBack: () => void;
}

export function CaseWorkspacePage({ assignment, onBack }: CaseWorkspacePageProps) {
    const [caseInfo, setCaseInfo] = useState<Case | null>(null);
    const [chart, setChart] = useState<ChartContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const c = await casesApi.get(assignment.case_id);
          const ctx = await clinicalNotesApi.context(c.patient_id);
          if (!cancelled) {
            setCaseInfo(c);
            setChart(ctx);
            setError(null);
          }
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load case");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [assignment.case_id]);
  
    const patient = caseInfo?.patient;
    const vitals = chart?.latest_vitals;
  
    return (
      <div>
        <button type="button" onClick={onBack} style={{ marginBottom: 16 }}>
          ← Back to My Assignments
        </button>
  
        <h1>
          Case #{assignment.case_id}
          {assignment.patient_name && ` · ${assignment.patient_name}`}
        </h1>
        <p style={{ color: "#555", marginTop: 0 }}>
          {assignment.course ?? "No course"}
          {assignment.due_date && ` · Due ${formatUtc(assignment.due_date)}`}
        </p>
  
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && <p>Loading...</p>}
  
        {caseInfo && (
          <>
            <Section title="Patient Demographics">
              {patient ? (
                <>
                  <Detail label="Name" value={`${patient.last_name}, ${patient.first_name}`} />
                  <Detail label="Preferred name" value={patient.preferred_name} />
                  <Detail label="Date of birth" value={patient.date_of_birth} />
                  <Detail label="Sex assigned at birth" value={patient.gender_at_birth} />
                  <Detail label="Gender identity" value={patient.gender_identity} />
                  <Detail label="Pronouns" value={patient.pronouns} />
                  <Detail label="MRN" value={patient.mrn} />
                </>
              ) : (
                <p style={{ color: "#888", margin: 0 }}>No patient information.</p>
              )}
            </Section>
  
            <Section title="Case Content">
              <Detail label="Chief complaint" value={caseInfo.chief_complaint} />
              <div style={{ whiteSpace: "pre-wrap" }}>
                <strong>Narrative / HPI:</strong> {caseInfo.narrative ?? "—"}
              </div>
            </Section>
  
            {chart && (
              <Section title="Chart Data">
                <strong>Medications</strong>
                {chart.medications.length === 0 ? (
                  <p style={{ color: "#888" }}>None recorded.</p>
                ) : (
                  <ul>
                    {chart.medications.map((m, i) => (
                      <li key={i}>
                        {m.name}
                        {m.dosage && ` · ${m.dosage}`}
                      </li>
                    ))}
                  </ul>
                )}
  
                <strong>Allergies</strong>
                {chart.allergies.length === 0 ? (
                  <p style={{ color: "#888" }}>No known allergies.</p>
                ) : (
                  <ul>
                    {chart.allergies.map((a, i) => (
                      <li key={i}>
                        {a.substance}
                        {a.reaction && ` · ${a.reaction}`}
                      </li>
                    ))}
                  </ul>
                )}
  
                <strong>Latest vitals</strong>
                {vitals ? (
                  <p>
                    BP {vitals.blood_pressure ?? "—"} · HR {vitals.heart_rate ?? "—"} · RR{" "}
                    {vitals.respiratory_rate ?? "—"} · Temp {vitals.temperature_c ?? "—"} °C · SpO₂{" "}
                    {vitals.oxygen_saturation ?? "—"}%
                  </p>
                ) : (
                  <p style={{ color: "#888" }}>None recorded.</p>
                )}
  
                <strong>Recent labs</strong>
                {chart.recent_labs.length === 0 ? (
                  <p style={{ color: "#888" }}>None recorded.</p>
                ) : (
                  <ul>
                    {chart.recent_labs.map((l, i) => (
                      <li key={i}>
                        {l.test_name}: {l.result}
                        {l.unit && ` ${l.unit}`}
                        {l.flag && ` (${l.flag})`}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}
  
            <WorkSection title="Medical and Family History">
              <MedicalHistoryPanel patientId={caseInfo.patient_id} />
            </WorkSection>
  
            <WorkSection title="Encounter Note">
              <ClinicalNotesPage initialPatientId={caseInfo.patient_id} />
            </WorkSection>
          </>
        )}
      </div>
    );
}
  



