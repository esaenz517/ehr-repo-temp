import { useAssignments } from "../../hooks/useAssignments";
import type { Assignment, EncounterStatus } from "../../types";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import { StatusBadge } from "../StatusBadge";
import "./dashboard.css";

interface StudentDashboardProps {
  username: string;
  studentId: number;
  onOpen: (assignment: Assignment) => void; // opens the case workspace
  onViewAll: () => void; // goes to My Assignments
}

const DAY_MS = 24 * 60 * 60 * 1000;

const isOpen = (a: Assignment) =>
  a.encounter_status === "not_started" || a.encounter_status === "in_progress";

// Due dates are stored in UTC without a time zone marker, so add "Z" before converting.
function dueTime(a: Assignment) {
  return a.due_date ? new Date(a.due_date + "Z").getTime() : null;
}

function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Short, friendly label for how close a due date is
function dueLabel(due: number | null, now: number): { text: string; tone: "late" | "soon" | "later" | "none" } {
  if (due === null) return { text: "No due date", tone: "none" };
  const diff = due - now;
  if (diff < 0) {
    const days = Math.floor(-diff / DAY_MS);
    return { text: days === 0 ? "Overdue today" : `Overdue by ${days} day${days === 1 ? "" : "s"}`, tone: "late" };
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return { text: hours <= 1 ? "Due within the hour" : `Due in ${hours} hours`, tone: "soon" };
  const days = Math.ceil(diff / DAY_MS);
  return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: days <= 3 ? "soon" : "later" };
}

function encouragement(open: number, overdue: number, total: number) {
  if (total === 0) return "No cases assigned yet. Check back soon!";
  if (overdue > 0) return `You have ${overdue} overdue case${overdue === 1 ? "" : "s"}. Let's get caught up.`;
  if (open === 0) return "You're all caught up. Great work!";
  return `${open} case${open === 1 ? "" : "s"} waiting for you. You've got this.`;
}

export function StudentDashboard({ username, studentId, onOpen, onViewAll }: StudentDashboardProps) {
  const { assignments, loading, error, start } = useAssignments(studentId);
  const nowDate = new Date();
  const now = nowDate.getTime();

  const count = (status: EncounterStatus) => assignments.filter((a) => a.encounter_status === status).length;
  const notStarted = count("not_started");
  const inProgress = count("in_progress");
  const done = count("submitted") + count("signed");
  const total = assignments.length;
  const open = notStarted + inProgress;
  const overdue = assignments.filter((a) => isOpen(a) && (dueTime(a) ?? Infinity) < now).length;
  const dueThisWeek = assignments.filter((a) => {
    const due = dueTime(a);
    return isOpen(a) && due !== null && due >= now && due - now <= 7 * DAY_MS;
  }).length;

  // Open cases, soonest due first; cases without a due date go last
  const upNext = assignments
    .filter(isOpen)
    .sort((a, b) => (dueTime(a) ?? Infinity) - (dueTime(b) ?? Infinity))
    .slice(0, 5);

  // Starting a case opens it straight into the workspace, same as My Assignments
  const startAndOpen = async (a: Assignment) => {
    const updated = await start(a.assignment_id);
    if (updated) onOpen(updated);
  };

  return (
    <div className="ui-page dash">
      <PageHeader
        title={<>{greeting(nowDate)}, <span className="dash-name">{username}</span></>}
        description={
          <>
            {nowDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            {" · "}
            {loading ? "Loading your cases…" : encouragement(open, overdue, total)}
          </>
        }
        actions={<button className="ui-button" onClick={onViewAll}>View my assignments</button>}
      />

      {error && <p className="ui-error">{error}</p>}

      <section className="ui-stats" aria-label="Assignment summary">
        <Stat tone="error" label="To do" value={notStarted} loading={loading} />
        <Stat tone="accent" label="In progress" value={inProgress} loading={loading} />
        <Stat tone="success" label="Completed" value={done} meta={`of ${total} assigned`} loading={loading} />
        <Stat
          tone={overdue > 0 ? "error" : "info"}
          label={overdue > 0 ? "Overdue" : "Due this week"}
          value={overdue > 0 ? overdue : dueThisWeek}
          loading={loading}
        />
      </section>

      <Panel
        title="Up next"
        description="Open cases, soonest due first."
        actions={
          upNext.length > 0 && (
            <button className="ui-button ui-button--ghost ui-button--small" onClick={onViewAll}>See all</button>
          )
        }
        flush
      >
        {loading ? (
          <p className="ui-row-empty">Loading your cases…</p>
        ) : upNext.length === 0 ? (
          <div className="ui-row-empty">
            <p className="dash-empty-title">{total === 0 ? "Nothing assigned yet" : "All caught up"}</p>
            <p className="ui-flush">
              {total === 0
                ? "When your instructor assigns a case, it will show up here."
                : "Every case you've been given has been submitted."}
            </p>
          </div>
        ) : (
          <ul className="ui-row-list">
            {upNext.map((a) => {
              const due = dueLabel(dueTime(a), now);
              const started = a.encounter_status === "in_progress";
              return (
                <li key={a.assignment_id} className="ui-row">
                  <div className="ui-row-main">
                    <div className="ui-row-title">
                      Case #{a.case_id}
                      {a.patient_name && <> · {a.patient_name}</>}
                    </div>
                    {a.chief_complaint && <div className="ui-row-subtitle">{a.chief_complaint}</div>}
                    <div className="dash-meta">
                      <span className={`ui-badge dash-due dash-due--${due.tone}`}>{due.text}</span>
                      {a.course && <span className="ui-badge ui-badge--muted">{a.course}</span>}
                      {a.assignment_type === "practice" && <span className="ui-badge ui-badge--muted">Practice</span>}
                    </div>
                  </div>
                  <div className="ui-row-actions">
                    <StatusBadge status={a.encounter_status} />
                    <button
                      className={started ? "ui-button ui-button--small" : "ui-button ui-button--secondary ui-button--small"}
                      onClick={() => (started ? onOpen(a) : startAndOpen(a))}
                    >
                      {started ? "Continue" : "Start"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

interface StatProps {
  tone: "error" | "accent" | "success" | "info";
  label: string;
  value: number;
  meta?: string; // small grey line under the number
  loading: boolean;
}

function Stat({ tone, label, value, meta, loading }: StatProps) {
  return (
    <div className={`ui-stat ui-stat--${tone}`}>
      <span className="ui-stat-value">{loading ? "–" : value}</span>
      <span className="ui-stat-label">{label}</span>
      {meta && !loading && <span className="ui-stat-meta">{meta}</span>}
    </div>
  );
}
