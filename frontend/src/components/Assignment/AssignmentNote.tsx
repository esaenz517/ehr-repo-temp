import { formatUtc } from "../../api/clinicalNotes";
import type { ChartContext } from "../../api/clinicalNotes";
import { useAssignmentNote } from "../../hooks/useAssignmentNote";
import type { Assignment } from "../../types";
import { SoapEditor } from "../ClinicalNotes/SoapEditor";
import "../ClinicalNotes/clinicalNotes.css";
import "./assignmentNote.css";

interface AssignmentNoteProps {
  assignment: Assignment;
  patientId: number;
  chiefComplaint: string;
  chart: ChartContext;
}

// The student's SOAP note inside the case workspace: save drafts, then submit the case.
// Once submitted (or signed) the note is read-only until the instructor sends it back.
export function AssignmentNote({ assignment, patientId, chiefComplaint, chart }: AssignmentNoteProps) {
  const n = useAssignmentNote(assignment, patientId, chiefComplaint);

  if (n.loading) {
    return <p className="ui-muted">Loading note…</p>;
  }

  if (n.assignment.encounter_id === null) {
    return n.locked ? (
      <p className="ui-muted">No note was saved for this case.</p>
    ) : (
      <div className="assignment-note-start">
        <p className="ui-muted">Start the case to open the SOAP note template.</p>
        <button type="button" className="ui-button" onClick={n.start}>
          Start case
        </button>
      </div>
    );
  }

  const submit = () => {
    if (window.confirm("Submit this case for review? You won't be able to edit the note afterwards.")) {
      n.submit();
    }
  };

  return (
    <div className="assignment-note">
      {n.locked && (
        <p className="assignment-note-banner">
          {n.assignment.encounter_status === "signed"
            ? "Signed off by your instructor. This note is read-only."
            : "Submitted for review. This note is read-only."}
        </p>
      )}
      {n.error && <p className="ui-error">{n.error}</p>}
      {n.message && <p className="assignment-note-message">{n.message}</p>}

      <div className="clinical-notes">
        <SoapEditor content={n.content} context={chart} disabled={n.locked || n.saving} onChange={n.edit} />
      </div>

      {!n.locked && (
        <div className="assignment-note-actions">
          <span className="ui-muted">
            {n.dirty
              ? "Unsaved changes"
              : n.note
                ? `Last saved ${formatUtc(n.note.last_modified_at)}`
                : "Not saved yet"}
          </span>
          <button
            type="button"
            className="ui-button ui-button--secondary"
            disabled={n.saving || (!!n.note && !n.dirty)}
            onClick={n.saveDraft}
          >
            {n.saving ? "Saving…" : "Save draft"}
          </button>
          <button type="button" className="ui-button" disabled={n.saving || !n.note || n.dirty} onClick={submit}>
            Submit for review
          </button>
        </div>
      )}
    </div>
  );
}
