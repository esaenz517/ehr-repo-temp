import { useEffect, useRef, useState } from "react";
import { formatUtc } from "../../api/clinicalNotes";
import { autosaveLabel, useAutosave } from "../../hooks/useAutosave";
import type { SaveReason } from "../../hooks/useAutosave";
import type { Assignment, EncounterStatus } from "../../types";
import "./assignmentNote.css";

//AI was used to assist in building this section as dev assigned to it is
// unfamiliar with frontend development.

interface InstructorFeedbackProps {
  assignment: Assignment;
  error?: string | null;
  signOffBlocked?: string | null; // Ensure all rubric items scored
  onSave: (feedback: string) => Promise<boolean>;
  onDecision: (status: EncounterStatus, feedback: string) => Promise<boolean>;
}

// Instructor's feedback box under a student's note. While the work is submitted the
// instructor can save a draft (the student can't see it yet), then sign off or send it
// back; either one saves the feedback with it. Signed work can still have its feedback edited.
export function InstructorFeedback({ assignment, error, signOffBlocked, onSave, onDecision }: InstructorFeedbackProps) {
  const [text, setText] = useState(assignment.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const status = assignment.encounter_status;
  const dirty = text.trim() !== (assignment.feedback ?? "");
  // Feedback can only be written on submitted or signed work
  const editable = status === "submitted" || status === "signed";

  // Bumped whenever a different assignment opens so a save that finishes late is ignored
  const assignmentToken = useRef(0);

  // Saves the typed feedback. Autosave skips when nothing changed.
  const saveFeedback = async (reason: SaveReason): Promise<boolean> => {
    if (!editable || (reason === "auto" && !dirty)) return true;
    const token = assignmentToken.current;
    const ok = await onSave(text);
    if (ok && reason === "manual" && token === assignmentToken.current) {
      setMessage("Feedback saved.");
    }
    return ok;
  };

  const autosave = useAutosave(saveFeedback, { enabled: editable });

  // Start from the saved feedback whenever a different assignment is opened. Only on
  // a new assignment: the saved feedback also changes after each autosave, and
  // resetting then would wipe out anything typed while the save was running.
  useEffect(() => {
    assignmentToken.current += 1;
    autosave.cancel();
    setText(assignment.feedback ?? "");
    setMessage(null);
  }, [assignment.assignment_id]);

  if (status === "not_started") return null;

  // Sent back: the student is reworking it, so show what they were told
  if (status === "in_progress") {
    return assignment.feedback ? (
      <section className="assignment-feedback">
        <h2>Feedback sent to the student</h2>
        <p className="assignment-feedback-text">{assignment.feedback}</p>
        <p className="ui-muted">You can write new feedback once they resubmit.</p>
      </section>
    ) : null;
  }

  const run = async (action: () => Promise<boolean>, done: string) => {
    // Sign off / send back save the feedback themselves, so drop any pending autosave
    autosave.cancel();
    setBusy(true);
    setMessage(null);
    if (await action()) setMessage(done);
    setBusy(false);
  };

  const sendBack = () => {
    if (!text.trim() && !window.confirm("Send this back without any feedback?")) return;
    run(() => onDecision("in_progress", text), "Sent back to the student with your feedback.");
  };

  return (
    <section className="assignment-feedback">
      <h2>Instructor feedback</h2>
      <p className="ui-muted">
        {status === "submitted"
          ? "The student sees this once you sign off or send the work back."
          : "Signed off. The student can see this feedback."}
        {assignment.feedback_updated_at && ` Last saved ${formatUtc(assignment.feedback_updated_at)}.`}
      </p>

      <textarea
        className="ui-input ui-input--full assignment-feedback-input"
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
          autosave.notifyEdit();
        }}
        placeholder="What went well, what to fix, and anything to review before resubmitting…"
        // Not disabled during autosave, so typing isn't interrupted
        disabled={busy}
      />

      {error && <p className="ui-error">{error}</p>}
      {message && <p className="assignment-note-message">{message}</p>}
      {status === "submitted" && signOffBlocked && <p className="ui-muted">{signOffBlocked}</p>}

      <div className="assignment-feedback-actions">
        <span className="ui-muted" aria-live="polite">
          {autosaveLabel(autosave.status)}
        </span>
        <button
          type="button"
          className="ui-button ui-button--secondary"
          disabled={busy || !dirty || autosave.status === "saving"}
          onClick={autosave.saveNow}
        >
          Save feedback
        </button>
        {status === "submitted" && (
          <>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              disabled={busy || autosave.status === "saving"}
              onClick={sendBack}
            >
              Send back
            </button>
            <button
              type="button"
              className="ui-button"
              disabled={busy || autosave.status === "saving"}
              onClick={() => run(() => onDecision("signed", text), "Signed off.")}
            >
              Sign off
            </button>
          </>
        )}
      </div>
    </section>
  );
}
