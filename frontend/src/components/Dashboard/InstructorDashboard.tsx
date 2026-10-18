import { useState } from "react";
import { useAssignments } from "../../hooks/useAssignments";
import { useStaff } from "../../hooks/useStaff";
import type { Assignment, EncounterStatus } from "../../types";
import "./instructorDashboard.css";

interface InstructorDashboardProps {
  staffId: number; // the instructor who handed out the assignments
  onReview: (assignment: Assignment) => void; // opens the student's note for review
}

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUSES: EncounterStatus[] = ["not_started", "in_progress", "submitted", "signed"];

const STATUS_LABELS: Record<EncounterStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  signed: "Signed",
};

// Due dates are stored in UTC without a time zone marker, so add "Z" before converting.
const dueTime = (a: Assignment) => (a.due_date ? new Date(a.due_date + "Z").getTime() : null);
const formatDue = (a: Assignment) =>
  a.due_date ? new Date(a.due_date + "Z").toLocaleDateString() : "No due date";

const isOpen = (a: Assignment) =>
  a.encounter_status === "not_started" || a.encounter_status === "in_progress";

// Sending work back sets it to in_progress with feedback, so that pair means "returned"
const statusLabel = (a: Assignment) =>
  a.encounter_status === "in_progress" && a.feedback ? "Returned" : STATUS_LABELS[a.encounter_status];

// Instructor home: what needs review, who is behind, and how each case is going.
export function InstructorDashboard({ staffId, onReview }: InstructorDashboardProps) {
  const { assignments, loading, error, reload } = useAssignments(staffId, "instructor");
  const { staff } = useStaff();
  const [course, setCourse] = useState("all");
  const [type, setType] = useState("graded");

  const studentName = (id: number) => {
    const s = staff.find((m) => m.staffid === id);
    return s ? `${s.last_name}, ${s.first_name}` : `Staff #${id}`;
  };

  const courses = [...new Set(assignments.map((a) => a.course).filter((c): c is string => !!c))].sort();

  const shown = assignments.filter(
    (a) =>
      (course === "all" || a.course === course) &&
      (type === "all" || (a.assignment_type ?? "graded") === type)
  );

  const now = Date.now();
  const reviewQueue = shown
    .filter((a) => a.encounter_status === "submitted")
    .sort((a, b) => (dueTime(a) ?? Infinity) - (dueTime(b) ?? Infinity));
  const overdue = shown.filter((a) => isOpen(a) && (dueTime(a) ?? Infinity) < now).length;
  const dueThisWeek = shown.filter((a) => {
    const due = dueTime(a);
    return isOpen(a) && due !== null && due >= now && due - now <= 7 * DAY_MS;
  }).length;
  const signed = shown.filter((a) => a.encounter_status === "signed").length;

  // One group per case, in the order the cases were first assigned
  const byCase = new Map<number, Assignment[]>();
  for (const a of shown) byCase.set(a.case_id, [...(byCase.get(a.case_id) ?? []), a]);

  return (
    <div className="ui-page idash">
      <div className="idash-header">
        <h1 className="ui-page-title">Instructor Dashboard</h1>
        <div className="idash-filters">
          <label className="ui-filter">
            Course
            <select className="ui-input" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="all">All courses</option>
              {courses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="ui-filter">
            Type
            <select className="ui-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="graded">Graded</option>
              <option value="practice">Practice</option>
              <option value="all">All</option>
            </select>
          </label>
          <button className="ui-button ui-button--secondary" onClick={reload}>Refresh</button>
        </div>
      </div>

      {error && <p className="ui-error">{error}</p>}

      <section className="idash-stats" aria-label="Summary">
        <Stat label="Needs review" value={reviewQueue.length} tone="review" loading={loading} />
        <Stat label="Overdue" value={overdue} tone="late" loading={loading} />
        <Stat label="Due this week" value={dueThisWeek} tone="week" loading={loading} />
        <Stat label="Signed" value={`${signed} / ${shown.length}`} tone="done" loading={loading} />
      </section>

      <section>
        <h2 className="idash-section-title">Review queue ({reviewQueue.length})</h2>
        {loading ? (
          <p className="ui-muted">Loading...</p>
        ) : reviewQueue.length === 0 ? (
          <p className="ui-row-empty">Nothing waiting for review.</p>
        ) : (
          <ul className="ui-row-list">
            {reviewQueue.map((a) => (
              <li key={a.assignment_id} className="ui-row">
                <div className="ui-row-main">
                  <div className="ui-row-title">{studentName(a.assigned_to)}</div>
                  <div className="ui-row-subtitle">
                    {a.patient_name ?? `Case #${a.case_id}`}
                    {a.chief_complaint && ` · ${a.chief_complaint}`} · Due {formatDue(a)}
                  </div>
                </div>
                <div className="ui-row-actions">
                  <button className="ui-button" onClick={() => onReview(a)}>Review</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="idash-section-title">Progress by case</h2>
        {!loading && byCase.size === 0 && (
          <p className="ui-row-empty">No assignments match these filters.</p>
        )}
        {[...byCase.entries()].map(([caseId, rows]) => (
          <details key={caseId} className="idash-case">
            <summary className="idash-case-summary">
              <span className="idash-case-title">
                {rows[0].patient_name ?? `Case #${caseId}`}
                {rows[0].chief_complaint && <span className="ui-muted"> · {rows[0].chief_complaint}</span>}
              </span>
              <ProgressBar rows={rows} />
            </summary>
            <ul className="idash-case-students">
              {rows.map((a) => (
                <li key={a.assignment_id} className="idash-case-student">
                  <span>{studentName(a.assigned_to)}</span>
                  <span className="ui-muted">Due {formatDue(a)}</span>
                  <span className={`idash-status idash-status--${a.encounter_status}`}>{statusLabel(a)}</span>
                  {a.encounter_status !== "not_started" && (
                    <button className="ui-button ui-button--secondary" onClick={() => onReview(a)}>
                      {a.encounter_status === "submitted" ? "Review" : "View note"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number | string;
  tone: "review" | "late" | "week" | "done";
  loading: boolean;
}

function Stat({ label, value, tone, loading }: StatProps) {
  return (
    <div className={`idash-stat idash-stat--${tone}`}>
      <div className="idash-stat-value">{loading ? "–" : value}</div>
      <div className="idash-stat-label">{label}</div>
    </div>
  );
}

// One colored segment per status, sized by how many students are in it
function ProgressBar({ rows }: { rows: Assignment[] }) {
  const counts = STATUSES.map((s) => ({ status: s, n: rows.filter((a) => a.encounter_status === s).length }));
  const text = counts.filter((c) => c.n > 0).map((c) => `${c.n} ${STATUS_LABELS[c.status].toLowerCase()}`).join(" · ");
  return (
    <span className="idash-progress">
      <span className="idash-bar" role="img" aria-label={text}>
        {counts.map((c) => c.n > 0 && (
          <span key={c.status} className={`idash-bar-part idash-status--${c.status}`} style={{ flexGrow: c.n }} />
        ))}
      </span>
      <span className="idash-progress-text">{text}</span>
    </span>
  );
}
