import type { ReactNode } from "react";
import { useAssignments } from "../../hooks/useAssignments";
import type { Assignment, EncounterStatus } from "../../types";
import "./dashboard.css";

interface StudentDashboardProps {
  username: string;
  studentId: number;
  onOpen: (assignment: Assignment) => void; // opens the case workspace
  onViewAll: () => void; // goes to My Assignments
}

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_LABELS: Record<EncounterStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  signed: "Signed",
};

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
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

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
      <section className="dash-hero">
        <div className="dash-hero-text">
          <p className="dash-hero-date">
            {nowDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="dash-hero-title">
            {greeting(nowDate)}, <span className="dash-hero-name">{username}</span>
          </h1>
          <p className="dash-hero-subtitle">
            {loading ? "Loading your cases..." : encouragement(open, overdue, total)}
          </p>
          <button className="dash-hero-cta" onClick={onViewAll}>
            View my assignments →
          </button>
        </div>
        <ProgressRing percent={percent} done={done} total={total} />
      </section>

      {error && <p className="ui-error">{error}</p>}

      <section className="dash-stats" aria-label="Assignment summary">
        <StatCard tone="todo" label="To do" value={notStarted} icon={<IconClipboard />} loading={loading} />
        <StatCard tone="progress" label="In progress" value={inProgress} icon={<IconPencil />} loading={loading} />
        <StatCard tone="done" label="Completed" value={done} icon={<IconCheck />} loading={loading} />
        <StatCard
          tone={overdue > 0 ? "late" : "week"}
          label={overdue > 0 ? "Overdue" : "Due this week"}
          value={overdue > 0 ? overdue : dueThisWeek}
          icon={<IconClock />}
          loading={loading}
        />
      </section>

      <section className="dash-panel">
        <div className="dash-panel-header">
          <h2 className="dash-panel-title">Up next</h2>
          {upNext.length > 0 && (
            <button className="dash-link" onClick={onViewAll}>See all</button>
          )}
        </div>

        {loading ? (
          <ul className="dash-list">
            {[0, 1, 2].map((i) => <li key={i} className="dash-item dash-skeleton" />)}
          </ul>
        ) : upNext.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-badge"><IconStar /></div>
            <p className="dash-empty-title">{total === 0 ? "Nothing assigned yet" : "All caught up!"}</p>
            <p className="ui-muted">
              {total === 0
                ? "When your instructor assigns a case, it will show up here."
                : "Every case you've been given has been submitted."}
            </p>
          </div>
        ) : (
          <ul className="dash-list">
            {upNext.map((a, i) => {
              const due = dueLabel(dueTime(a), now);
              const started = a.encounter_status === "in_progress";
              return (
                <li key={a.assignment_id} className={`dash-item dash-item--${due.tone}`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="dash-item-avatar" aria-hidden="true">
                    {(a.patient_name ?? "?").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="dash-item-main">
                    <div className="dash-item-title">
                      Case #{a.case_id}
                      {a.patient_name && <span className="dash-item-patient"> · {a.patient_name}</span>}
                    </div>
                    {a.chief_complaint && <div className="dash-item-complaint">{a.chief_complaint}</div>}
                    <div className="dash-item-meta">
                      <span className={`dash-chip dash-chip--${due.tone}`}>{due.text}</span>
                      <span className={`dash-chip dash-chip--status-${a.encounter_status}`}>
                        {STATUS_LABELS[a.encounter_status]}
                      </span>
                      {a.course && <span className="dash-chip">{a.course}</span>}
                      {a.assignment_type === "practice" && <span className="dash-chip">Practice</span>}
                    </div>
                  </div>
                  <button
                    className={`dash-item-action${started ? " dash-item-action--continue" : ""}`}
                    onClick={() => (started ? onOpen(a) : startAndOpen(a))}
                  >
                    {started ? "Continue" : "Start"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  tone: "todo" | "progress" | "done" | "week" | "late";
  label: string;
  value: number;
  icon: ReactNode;
  loading: boolean;
}

function StatCard({ tone, label, value, icon, loading }: StatCardProps) {
  return (
    <div className={`dash-stat dash-stat--${tone}`}>
      <div className="dash-stat-icon" aria-hidden="true">{icon}</div>
      <div>
        <div className="dash-stat-value">{loading ? "–" : value}</div>
        <div className="dash-stat-label">{label}</div>
      </div>
    </div>
  );
}

function ProgressRing({ percent, done, total }: { percent: number; done: number; total: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="dash-ring" role="img" aria-label={`${done} of ${total} cases completed`}>
      <svg viewBox="0 0 120 120" width="132" height="132">
        <circle className="dash-ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="dash-ring-fill"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <div className="dash-ring-label">
        <span className="dash-ring-percent">{percent}%</span>
        <span className="dash-ring-caption">{done}/{total} done</span>
      </div>
    </div>
  );
}

// Small inline icons so the dashboard needs no icon library
const iconProps = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

const IconClipboard = () => (
  <svg {...iconProps}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M9 12h6M9 16h4" /></svg>
);
const IconPencil = () => (
  <svg {...iconProps}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>
);
const IconCheck = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>
);
const IconClock = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const IconStar = () => (
  <svg {...iconProps} width={32} height={32}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
);