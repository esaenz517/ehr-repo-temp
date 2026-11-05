import { useState } from "react";
import { useAssignments } from "../../hooks/useAssignments";
import { useStaff } from "../../hooks/useStaff";
import type { Assignment, EncounterStatus } from "../../types";
import { STATUS_LABELS, StatusBadge } from "../StatusBadge";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import "./instructorDashboard.css";

interface InstructorDashboardProps {
  staffId: number; // the instructor who handed out the assignments
  onReview: (assignment: Assignment) => void; // opens the student's note for review
}

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUSES: EncounterStatus[] = ["not_started", "in_progress", "submitted", "signed"];

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
      <PageHeader
        title="Dashboard"
        description="What needs review, who is behind, and how each case is going."
        actions={
          <>
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
          </>
        }
      />

      {error && <p className="ui-error">{error}</p>}

      <section className="ui-stats" aria-label="Summary">
        <Stat label="Needs review" value={reviewQueue.length} tone="info" loading={loading} />
        <Stat label="Overdue" value={overdue} tone="error" loading={loading} />
        <Stat label="Due this week" value={dueThisWeek} tone="accent" loading={loading} />
        <Stat label="Signed" value={signed} meta={`of ${shown.length} assigned`} tone="success" loading={loading} />
      </section>

      <Panel
        title="Review queue"
        description="Submitted notes waiting for your sign-off, soonest due first."
        actions={<span className="ui-badge">{reviewQueue.length} waiting</span>}
        flush
      >
        {loading ? (
          <p className="ui-row-empty">Loading…</p>
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
                  <button className="ui-button ui-button--small" onClick={() => onReview(a)}>Review</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Progress by case"
        description="Click a case to see each student's status."
        flush
      >
        {loading ? (
          <p className="ui-row-empty">Loading…</p>
        ) : byCase.size === 0 ? (
          <p className="ui-row-empty">No assignments match these filters.</p>
        ) : (
          <div className="idash-cases">
            {[...byCase.entries()].map(([caseId, rows]) => (
              <details key={caseId} className="idash-case">
                <summary className="idash-case-summary">
                  <span className="idash-case-title">
                    {rows[0].patient_name ?? `Case #${caseId}`}
                    {rows[0].chief_complaint && <span className="idash-case-complaint">{rows[0].chief_complaint}</span>}
                  </span>
                  <ProgressBar rows={rows} />
                </summary>
                <ul className="idash-case-students">
                  {rows.map((a) => (
                    <li key={a.assignment_id} className="idash-case-student">
                      <span className="idash-case-student-name">{studentName(a.assigned_to)}</span>
                      <span className="ui-muted">Due {formatDue(a)}</span>
                      <StatusBadge status={a.encounter_status} label={statusLabel(a)} />
                      <span className="idash-case-student-action">
                        {a.encounter_status !== "not_started" && (
                          <button className="ui-button ui-button--secondary ui-button--small" onClick={() => onReview(a)}>
                            {a.encounter_status === "submitted" ? "Review" : "View note"}
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number | string;
  meta?: string; // small grey line under the number
  tone: "info" | "error" | "accent" | "success";
  loading: boolean;
}

function Stat({ label, value, meta, tone, loading }: StatProps) {
  return (
    <div className={`ui-stat ui-stat--${tone}`}>
      <span className="ui-stat-value">{loading ? "–" : value}</span>
      <span className="ui-stat-label">{label}</span>
      {meta && !loading && <span className="ui-stat-meta">{meta}</span>}
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
          <span key={c.status} className={`idash-bar-part idash-bar-part--${c.status}`} title={`${c.n} ${STATUS_LABELS[c.status].toLowerCase()}`} style={{ flexGrow: c.n }} />
        ))}
      </span>
      <span className="idash-progress-text">{text}</span>
    </span>
  );
}
