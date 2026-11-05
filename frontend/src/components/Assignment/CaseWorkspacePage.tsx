import { ReactNode, useEffect, useState } from "react";
import { casesApi } from "../../api/cases";
import { clinicalNotesApi, formatUtc } from "../../api/clinicalNotes";
import type { ChartContext } from "../../api/clinicalNotes";
import type { Assignment, Case } from "../../types";
import { StatusBadge } from "../StatusBadge";
import { AssignmentNote } from "./AssignmentNote";
import { MedicalHistoryPanel } from "../MedicalHistory/MedicalHistoryPanel";
import { Section } from "../Section";
import { PageHeader } from "../PageHeader";

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </>
  );
}

// A section that stays closed until the student clicks it open to work on it.
function WorkSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Section
      title={title}
      actions={
        <button
          type="button"
          className="ui-button ui-button--secondary ui-button--small"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Open"}
        </button>
      }
    >
      {open ? children : null}
    </Section>
  );
}

interface CaseWorkspacePageProps {
  assignment: Assignment;
  onBack: () => void;
  backLabel?: string; // where the back button returns to
}

export function CaseWorkspacePage({ assignment, onBack, backLabel = "My Assignments" }: CaseWorkspacePageProps) {
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
      <div className="ui-page">
        <PageHeader
          back={{ label: backLabel, onClick: onBack }}
          title={
            <>
              Case #{assignment.case_id}
              {assignment.patient_name && ` · ${assignment.patient_name}`}
            </>
          }
          description={
            <>
              {assignment.course ?? "No course"}
              {assignment.due_date && ` · Due ${formatUtc(assignment.due_date)}`}
            </>
          }
          actions={<StatusBadge status={assignment.encounter_status} />}
        />

        {error && <p className="ui-error">{error}</p>}
        {loading && <p className="ui-row-empty">Loading case…</p>}

        {caseInfo && (
          <>
            <div className="ui-columns">
            <Section title="Patient demographics">
              {patient ? (
                <dl className="ui-detail-list">
                  <Detail label="Name" value={`${patient.last_name}, ${patient.first_name}`} />
                  <Detail label="Preferred name" value={patient.preferred_name} />
                  <Detail label="Date of birth" value={patient.date_of_birth} />
                  <Detail label="Sex assigned at birth" value={patient.gender_at_birth} />
                  <Detail label="Gender identity" value={patient.gender_identity} />
                  <Detail label="Pronouns" value={patient.pronouns} />
                  <Detail label="MRN" value={patient.mrn} />
                </dl>
              ) : (
                <p className="ui-muted">No patient information.</p>
              )}
            </Section>

            <Section title="Case content">
              <dl className="ui-detail-list">
                <Detail label="Chief complaint" value={caseInfo.chief_complaint} />
                <Detail label="Narrative / HPI" value={<span className="ui-prewrap">{caseInfo.narrative ?? "—"}</span>} />
              </dl>
            </Section>
            </div>

            {chart && (
              <Section title="Chart data">
                <h3 className="ui-subheading">Medications</h3>
                {chart.medications.length === 0 ? (
                  <p className="ui-muted">None recorded.</p>
                ) : (
                  <ul className="ui-plain-list">
                    {chart.medications.map((m, i) => (
                      <li key={i}>
                        {m.name}
                        {m.dosage && ` · ${m.dosage}`}
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="ui-subheading">Allergies</h3>
                {chart.allergies.length === 0 ? (
                  <p className="ui-muted">No known allergies.</p>
                ) : (
                  <ul className="ui-plain-list">
                    {chart.allergies.map((a, i) => (
                      <li key={i}>
                        {a.substance}
                        {a.reaction && ` · ${a.reaction}`}
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="ui-subheading">Latest vitals</h3>
                {vitals ? (
                  <p>
                    BP {vitals.blood_pressure ?? "—"} · HR {vitals.heart_rate ?? "—"} · RR{" "}
                    {vitals.respiratory_rate ?? "—"} · Temp {vitals.temperature_c ?? "—"} °C · SpO₂{" "}
                    {vitals.oxygen_saturation ?? "—"}%
                  </p>
                ) : (
                  <p className="ui-muted">None recorded.</p>
                )}

                <h3 className="ui-subheading">Recent labs</h3>
                {chart.recent_labs.length === 0 ? (
                  <p className="ui-muted">None recorded.</p>
                ) : (
                  <ul className="ui-lab-list">
                    {chart.recent_labs.map((l, i) => {
                      const flag = l.flag?.trim() ?? "";
                      const isAbnormal =
                        flag !== "" &&
                        !["normal", "none", "n", "within range"].includes(
                          flag.toLowerCase()
                        );

                      return (
                        <li key={i} className={`ui-lab${isAbnormal ? " ui-lab--abnormal" : ""}`}>
                          <strong>{l.test_name}</strong>: {l.result}
                          {l.unit && ` ${l.unit}`}

                          {flag && (
                            <span
                              role={isAbnormal ? "alert" : undefined}
                              className={`ui-badge ${isAbnormal ? "ui-badge--error" : "ui-badge--success"}`}
                            >
                              {isAbnormal ? "⚠ " : ""}
                              {flag}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>
            )}

            <WorkSection title="Medical and family history">
              <MedicalHistoryPanel patientId={caseInfo.patient_id} />
            </WorkSection>

            {chart && (
              <Section title="SOAP note" overflow>
                <AssignmentNote
                  assignment={assignment}
                  patientId={caseInfo.patient_id}
                  chiefComplaint={caseInfo.chief_complaint}
                  chart={chart}
                />
              </Section>
            )}
          </>
        )}
      </div>
    );
}
