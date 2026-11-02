import { useState } from "react";
import { AssignmentList } from "./AssignmentList";
import { AssignmentReview } from "./AssignmentReview";
import { StudentNoteView } from "./StudentNoteView";
import { useAssignments } from "../../hooks/useAssignments";
import { useStaff } from "../../hooks/useStaff";
import { STATUS_LABELS } from "../StatusBadge";
import type { Assignment, EncounterStatus } from "../../types";

interface AssignedCasesPageProps {
  staffId: number; // the instructor who handed out the assignments
  initialViewingId?: number | null; // opens this assignment's note right away (from the dashboard)
}

// Instructor view: every assignment this staff member handed out, with each
// student's progress. Started work can be opened to read the student's saved
// SOAP note; submitted work is scored on the case's rubric, given feedback,
// then signed off or sent back for re-work.
export function AssignedCasesPage({ staffId, initialViewingId = null }: AssignedCasesPageProps) {
  const { assignments, loading, error, reload, updateStatus, saveFeedback } = useAssignments(staffId, "instructor");
  const { staff } = useStaff();
  const [viewingId, setViewingId] = useState<number | null>(initialViewingId);
  // Looked up from the list so Sign off / Send back show the new status right away
  const viewing = assignments.find((a) => a.assignment_id === viewingId);

  const [search, setSearch] = useState(""); // matches the case #, student, patient, or chief complaint
  const [status, setStatus] = useState<EncounterStatus | "all">("all");
  const [course, setCourse] = useState("all"); // "all", "none", or a course name

  const studentName = (id: number) => {
    const s = staff.find((m) => m.staffid === id);
    return s ? `${s.last_name}, ${s.first_name}` : `Staff #${id}`;
  };

  // Every course some assignment belongs to, A to Z
  const courseOptions = [...new Set(assignments.map((a) => a.course).filter((c): c is string => Boolean(c)))].sort();
  const hasNoCourse = assignments.some((a) => !a.course);

  const query = search.trim().toLowerCase();
  const shown = assignments.filter(
    (a) =>
      (!query ||
        [`Case #${a.case_id}`, studentName(a.assigned_to), a.patient_name, a.chief_complaint].some((v) =>
          (v ?? "").toLowerCase().includes(query)
        )) &&
      (status === "all" || a.encounter_status === status) &&
      (course === "all" || (course === "none" ? !a.course : a.course === course))
  );

  const filtering = query !== "" || status !== "all" || course !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCourse("all");
  };

  // Sign off / Send back happen inside the note view, next to the feedback box
  const actions = (a: Assignment) =>
    a.encounter_status !== "not_started" && (
      <button className={`ui-button${a.encounter_status === "submitted" ? "" : " ui-button--secondary"}`} onClick={() => setViewingId(a.assignment_id)}>
        {a.encounter_status === "submitted" ? "Review" : "View note"}
      </button>
    );

  if (viewing) {
    return (
      <StudentNoteView
        assignment={viewing}
        studentName={studentName(viewing.assigned_to)}
        review={
          <AssignmentReview
            assignment={viewing}
            error={error}
            onSaveFeedback={(text) => saveFeedback(viewing.assignment_id, text)}
            onDecision={(status, text) => updateStatus(viewing.assignment_id, status, text)}
          />
        }
        onRefresh={reload}
        onBack={() => setViewingId(null)}
      />
    );
  }

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Assigned Cases</h1>
      <div className="ui-toolbar">
        <button className="ui-button ui-button--secondary" onClick={reload}>Refresh</button>
      </div>

      <div className="ui-filter-bar" role="search" aria-label="Filter assigned cases">
        <label className={`ui-filter-field${query ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Case #, student, or patient"
            className="ui-input"
          />
        </label>

        <label className={`ui-filter-field${status !== "all" ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EncounterStatus | "all")}
            className="ui-input"
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_LABELS) as EncounterStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>

        <label className={`ui-filter-field${course !== "all" ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Course</span>
          <select value={course} onChange={(e) => setCourse(e.target.value)} className="ui-input">
            <option value="all">All courses</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            {hasNoCourse && <option value="none">No course</option>}
          </select>
        </label>

        {filtering && (
          <button type="button" className="ui-button ui-button--secondary ui-filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        <div className="ui-filter-summary">
          {!loading && (
            <span aria-live="polite">
              Showing <strong>{shown.length}</strong> of {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {error && <p className="ui-error">{error}</p>}
      {loading ? (
        <p className="ui-muted">Loading...</p>
      ) : assignments.length === 0 ? (
        <p className="ui-row-empty">You haven't assigned any cases yet.</p>
      ) : shown.length === 0 ? (
        <p className="ui-row-empty">No assigned cases match these filters.</p>
      ) : (
        <AssignmentList assignments={shown} studentName={studentName} actions={actions} />
      )}
    </div>
  );
}