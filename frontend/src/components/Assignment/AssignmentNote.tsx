import { useEffect, useState } from "react";
import { clinicalNotesApi, formatUtc } from "../../api/clinicalNotes";
import type { NoteAddendum } from "../../api/clinicalNotes";
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
  const [addenda, setAddenda] = useState<NoteAddendum[]>([]);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  useEffect(() => {
    if (n.assignment.encounter_status !== "signed" || !n.note) {
      setAddenda([]);
      return;
    }

    let cancelled = false;

    clinicalNotesApi
      .addenda(n.note.note_id)
      .then((records) => {
        if (!cancelled) setAddenda(records);
      })
      .catch((err) => {
        if (!cancelled) {
          setCorrectionError(
            err instanceof Error ? err.message : "Failed to load corrections"
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [n.assignment.encounter_status, n.note?.note_id]);

  const submitCorrection = async () => {
    if (
      n.assignment.encounter_status !== "signed" ||
      !n.note ||
      !correctionText.trim() ||
      correctionSaving
    ) {
      return;
    }

    setCorrectionSaving(true);
    setCorrectionError(null);

    try {
      const created = await clinicalNotesApi.createAddendum(
        n.note.note_id,
        correctionText.trim()
      );

      setAddenda((previous) => [...previous, created]);
      setCorrectionText("");
    } catch (err) {
      setCorrectionError(
        err instanceof Error ? err.message : "Failed to submit correction"
      );
    } finally {
      setCorrectionSaving(false);
    }
  };

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

      {n.assignment.encounter_status === "signed" && n.note && (
        <section className="assignment-note-corrections">
          <h3>Student Corrections</h3>
          <p className="ui-muted">
            Add a correction to your approved SOAP note.
            The original note will remain unchanged.
          </p>

          <label htmlFor="correction-text">Correction details</label>
          <textarea
            id="correction-text"
            className="ui-input"
            rows={4}
            maxLength={10000}
            value={correctionText}
            onChange={(event) => setCorrectionText(event.target.value)}
            placeholder="Describe what needs to be corrected..."
          />

          {correctionError && (
            <p className="ui-error">{correctionError}</p>
          )}

          <button
            type="button"
            className="ui-button"
            disabled={correctionSaving || !correctionText.trim()}
            onClick={submitCorrection}
          >
            {correctionSaving ? "Submitting…" : "Submit Correction"}
          </button>

          {addenda.length > 0 && (
            <div className="assignment-note-correction-history">
              <h4>Correction History</h4>
              {addenda.map((item) => (
                <div key={item.addendum_id} className="assignment-note-correction-item">
                  <p>{item.content}</p>
                  <small className="ui-muted">
                    Submitted: {formatUtc(item.created_at)}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
