import { useEffect, useRef, useState } from "react";
import { assignmentApi } from "../api/assignment";
import { blankSoap, clinicalNotesApi } from "../api/clinicalNotes";
import type { ClinicalNote, SoapContent } from "../api/clinicalNotes";
import type { Assignment } from "../types";
import { useAutosave } from "./useAutosave";
import type { SaveReason } from "./useAutosave";

// The student's SOAP note for one assignment: load it, save drafts, and submit the case.
export function useAssignmentNote(initial: Assignment, patientId: number, chiefComplaint: string) {
  const [assignment, setAssignment] = useState(initial);
  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [content, setContent] = useState<SoapContent>(() => ({ ...blankSoap(), chief_complaint: chiefComplaint }));
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Bumped on every edit so a save only clears `dirty` if nothing was typed while it ran
  const editRevision = useRef(0);

  // Load the saved note (if any) once the assignment has an encounter
  useEffect(() => {
    if (assignment.encounter_id === null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    assignmentApi
      .note(assignment.assignment_id)
      .then((saved) => {
        if (cancelled || !saved) return;
        setNote(saved);
        setContent(saved.content);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [assignment.assignment_id, assignment.encounter_id]);

  const edit = (next: SoapContent) => {
    setContent(next);
    setDirty(true);
    setMessage(null);
    editRevision.current += 1;
    autosave.notifyEdit();
  };

  // Gives the assignment its encounter (needed before the first save)
  const start = async () => {
    try {
      setAssignment(await assignmentApi.start(assignment.assignment_id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start case");
    }
  };

  const saveDraft = async (reason: SaveReason = "manual"): Promise<boolean> => {
    if (assignment.encounter_id === null || locked) return true;
    // Autosave only runs after the student has typed something
    if (reason === "auto" && !dirty) return true;
    const revision = editRevision.current;
    setSaving(true);
    try {
      const saved = note
        ? await clinicalNotesApi.save(note.note_id, note.current_version, content, reason === "auto" ? "Autosave" : "")
        : await clinicalNotesApi.create(patientId, assignment.encounter_id, content, "general");
      setNote(saved);
      if (editRevision.current === revision) setDirty(false);
      setError(null);
      setMessage(reason === "auto" ? null : "Draft saved.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const locked = assignment.encounter_status === "submitted" || assignment.encounter_status === "signed";

  const autosave = useAutosave(saveDraft, {
    enabled: !locked && assignment.encounter_id !== null,
  });

  const submit = async () => {
    if (dirty || saving) {
      setError("Save your draft before submitting.");
      return;
    }
    try {
      setAssignment(await assignmentApi.submit(assignment.assignment_id));
      setError(null);
      setMessage("Case submitted for review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit case");
    }
  };

  return { assignment, note, content, dirty, loading, saving, error, message, locked, autosaveStatus: autosave.status, edit, start, saveDraft: autosave.saveNow, submit };
}
