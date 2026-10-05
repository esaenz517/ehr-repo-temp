import { ReactNode, useCallback, useEffect, useState } from "react";
import { assignmentApi } from "../../api/assignment";
import { casesApi } from "../../api/cases";
import { clinicalNotesApi, formatUtc } from "../../api/clinicalNotes";
import type { ChartContext, ClinicalNote } from "../../api/clinicalNotes";
import type { Assignment } from "../../types";
import { SoapEditor } from "../ClinicalNotes/SoapEditor";
import "../ClinicalNotes/clinicalNotes.css";
import "./assignmentNote.css";

interface StudentNoteViewProps {
  assignment: Assignment;
  studentName: string;
  actions?: ReactNode; // Sign off / Send back, when the work is submitted
  onRefresh?: () => void; // also reload the assignment, in case its status changed
  onBack: () => void;
}

// Instructor view of a student's SOAP note: the latest saved draft, read-only.
// Unsaved typing on the student's side isn't visible until they save.
export function StudentNoteView({ assignment, studentName, actions, onRefresh, onBack }: StudentNoteViewProps) {
  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [chart, setChart] = useState<ChartContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const c = await casesApi.get(assignment.case_id);
      const [ctx, saved] = await Promise.all([
        clinicalNotesApi.context(c.patient_id),
        assignmentApi.note(assignment.assignment_id),
      ]);
      setChart(ctx);
      setNote(saved);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load note");
    } finally {
      setLoading(false);
    }
  }, [assignment.assignment_id, assignment.case_id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <button type="button" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to Assigned Cases
      </button>

      <h1>
        {studentName} · Case #{assignment.case_id}
        {assignment.patient_name && ` · ${assignment.patient_name}`}
      </h1>
      <p className="ui-muted">
        {assignment.chief_complaint ?? "No chief complaint"} · {assignment.course ?? "No course"}
      </p>

      <div className="assignment-note-toolbar">
        <span className="ui-muted">
          {note
            ? `Version ${note.current_version} · last saved ${formatUtc(note.last_modified_at)}`
            : "No draft saved yet"}
        </span>
        <button type="button" className="ui-button ui-button--secondary" onClick={() => { load(); onRefresh?.(); }} disabled={loading}>
          Refresh
        </button>
        {actions}
      </div>

      {error && <p className="ui-error">{error}</p>}
      {loading && <p className="ui-muted">Loading note…</p>}

      {!loading && note && chart && (
        <>
          <p className="assignment-note-banner">Read-only: this is the student's latest saved draft.</p>
          <div className="clinical-notes">
            <SoapEditor content={note.content} context={chart} disabled onChange={() => {}} />
          </div>
        </>
      )}
    </div>
  );
}
