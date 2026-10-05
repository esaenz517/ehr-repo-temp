import { useEffect, useState } from "react";
import { assignmentApi } from "../api/assignment";
import { blankSoap, clinicalNotesApi } from "../api/clinicalNotes";
import type { ClinicalNote, SoapContent } from "../api/clinicalNotes";
import type { Assignment } from "../types";

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

  const saveDraft = async () => {
    if (assignment.encounter_id === null) return;
    setSaving(true);
    try {
      const saved = note
        ? await clinicalNotesApi.save(note.note_id, note.current_version, content, "")
        : await clinicalNotesApi.create(patientId, assignment.encounter_id, content, "general");
      setNote(saved);
      setDirty(false);
      setError(null);
      setMessage("Draft saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (dirty) {
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

  const locked = assignment.encounter_status === "submitted" || assignment.encounter_status === "signed";

  return { assignment, note, content, dirty, loading, saving, error, message, locked, edit, start, saveDraft, submit };
}
