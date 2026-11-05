import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { gradesApi } from "../../api/grades";

import type {
    Grade,
    ProgressReport,
} from "../../api/grades";

import { GradeEditor } from "../Grades/GradeEditor";
import { ScoreBars, StatusBreakdown } from "../Charts/Charts";
import { StatusBadge } from "../StatusBadge";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";

import "../Grades/grades.css";


// Short date + time ("Oct 1, 6:00 PM") so table rows stay on one line; the full date is in the tooltip
function dateLabel(value: string | null) {
    return value
        ? new Date(
            value.endsWith("Z")
                ? value
                : `${value}Z`
        ).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : "—";
}

function fullDate(value: string | null) {
    return value
        ? new Date(value.endsWith("Z") ? value : `${value}Z`).toLocaleString()
        : undefined;
}


export function InstructorProgressPage() {
    const [report, setReport] =
        useState<ProgressReport | null>(null);

    const [grades, setGrades] =
        useState<Grade[]>([]);

    const [selected, setSelected] =
        useState<number | null>(null);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [onlyAlerts, setOnlyAlerts] =
        useState(false);

    // Opening the grade editor scrolls down to it (it renders under the tables)
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selected !== null) {
            editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [selected]);


    const reload = useCallback(async () => {
        try {
            const [
                value,
                instructorGrades,
            ] = await Promise.all([
                gradesApi.progress(),
                gradesApi.instructor(),
            ]);

            setReport(value);
            setGrades(instructorGrades);
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load progress"
            );
        } finally {
            setLoading(false);
        }
    }, []);


    // Refresh progress while the instructor has this page open.
    useEffect(() => {
        void reload();

        const timer = window.setInterval(() => {
            void reload();
        }, 60000);

        return () => {
            window.clearInterval(timer);
        };
    }, [reload]);


    const shown =
        report?.assignments.filter(
            (assignment) =>
                !onlyAlerts ||
                assignment.alert !== null
        ) ?? [];


    const gradeByAssignment = new Map(
        grades.map((grade) => [
            grade.assignment_id,
            grade,
        ])
    );


    // Find the assignment currently open in the grade editor.
    const selectedAssignment =
        report?.assignments.find(
            (assignment) =>
                assignment.assignment_id === selected
        );


    // Aggregate published graded-case scores by student.
    const studentScores = new Map<
        number,
        {
            name: string;
            earned: number;
            possible: number;
            count: number;
        }
    >();


    for (const assignment of report?.assignments ?? []) {
        const grade = gradeByAssignment.get(
            assignment.assignment_id
        );

        if (
            !grade?.published_at ||
            grade.assignment_type !== "graded"
        ) {
            continue;
        }

        const existing =
            studentScores.get(assignment.assigned_to) ?? {
                name: assignment.student_name,
                earned: 0,
                possible: 0,
                count: 0,
            };

        existing.earned += grade.final_points;
        existing.possible += grade.possible_points;
        existing.count++;

        studentScores.set(
            assignment.assigned_to,
            existing
        );
    }


    const scoreRows = Array.from(studentScores.entries());

    return (
        <div className="ui-page">
            <PageHeader
                title="Student Progress"
                description="Based on saved SOAP notes and assignment status. Unsaved typing is not recorded as progress."
                actions={
                    <button
                        type="button"
                        className="ui-button ui-button--secondary"
                        onClick={() => {
                            void reload();
                        }}
                    >
                        Refresh
                    </button>
                }
            />

            {error && (
                <p className="ui-error" role="alert">
                    {error}
                </p>
            )}

            {report && (report.inactive > 0 || report.overdue > 0) && (
                <p className="ui-alert ui-alert--warning" role="status">
                    <strong>Attention needed:</strong>{" "}
                    {report.inactive} inactive and {report.overdue} overdue assignment
                    {report.inactive + report.overdue === 1 ? "" : "s"}.
                </p>
            )}

            {loading && !report ? (
                <p className="ui-row-empty">Loading progress…</p>
            ) : (
                <>
                    {report && (
                        <div className="ui-stats" aria-label="Assignment progress summary">
                            <div className="ui-stat">
                                <span className="ui-stat-value">{report.total}</span>
                                <span className="ui-stat-label">Total cases</span>
                            </div>

                            <div className="ui-stat ui-stat--accent">
                                <span className="ui-stat-value">{report.in_progress}</span>
                                <span className="ui-stat-label">In progress</span>
                            </div>

                            <div className="ui-stat ui-stat--success">
                                <span className="ui-stat-value">{report.submitted + report.signed}</span>
                                <span className="ui-stat-label">Submitted or signed</span>
                            </div>

                            <div className="ui-stat ui-stat--error">
                                <span className="ui-stat-value">{report.inactive}</span>
                                <span className="ui-stat-label">Inactive alerts</span>
                            </div>

                            <div className="ui-stat ui-stat--error">
                                <span className="ui-stat-value">{report.overdue}</span>
                                <span className="ui-stat-label">Overdue alerts</span>
                            </div>
                        </div>
                    )}

                    {report && report.total > 0 && (
                        <Panel title="Where every case stands" description="Share of assigned cases in each status.">
                            <StatusBreakdown
                                counts={{
                                    not_started: report.not_started,
                                    in_progress: report.in_progress,
                                    submitted: report.submitted,
                                    signed: report.signed,
                                }}
                            />
                        </Panel>
                    )}

                    <Panel
                        title="Assignments"
                        description="Grade opens once a student submits."
                        actions={
                            <label className="ui-checkbox">
                                <input
                                    type="checkbox"
                                    checked={onlyAlerts}
                                    onChange={(e) => setOnlyAlerts(e.target.checked)}
                                />
                                Show alerts only
                            </label>
                        }
                        flush
                    >
                        {report && !shown.length ? (
                            <p className="ui-row-empty">
                                {onlyAlerts
                                    ? "No current inactivity or overdue alerts."
                                    : "No cases assigned by your account."}
                            </p>
                        ) : (
                            <div className="ui-table-wrap">
                                <table className="ui-table progress-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Case</th>
                                            <th>Course</th>
                                            <th>Status</th>
                                            <th>Due</th>
                                            <th>Last saved</th>
                                            <th>Grade</th>
                                            <th>Alert</th>
                                            <th><span className="ui-visually-hidden">Actions</span></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {shown.map((assignment) => {
                                            const grade = gradeByAssignment.get(assignment.assignment_id);
                                            const open = selected === assignment.assignment_id;

                                            return (
                                                <tr
                                                    key={assignment.assignment_id}
                                                    className={open ? "progress-row--open" : undefined}
                                                >
                                                    <td className="progress-student">{assignment.student_name}</td>
                                                    <td>#{assignment.case_id}</td>
                                                    <td>{assignment.course ?? "—"}</td>
                                                    <td>
                                                        <StatusBadge status={assignment.encounter_status} />
                                                    </td>
                                                    <td className="progress-date" title={fullDate(assignment.due_date)}>{dateLabel(assignment.due_date)}</td>
                                                    <td className="progress-date" title={fullDate(assignment.last_saved_at)}>{dateLabel(assignment.last_saved_at)}</td>
                                                    <td className="progress-grade">
                                                        {grade ? (
                                                            <>
                                                                {grade.final_points.toFixed(2)} / {grade.possible_points.toFixed(2)}
                                                                {!grade.published_at && (
                                                                    <span className="ui-badge ui-badge--muted progress-draft">Draft</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="ui-muted">Not graded</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {assignment.alert === "inactive" ? (
                                                            <span
                                                                className="ui-badge ui-badge--warning"
                                                                title={`Threshold ${assignment.inactivity_threshold_hours?.toFixed(1)}h`}
                                                            >
                                                                Inactive {assignment.idle_hours.toFixed(1)}h
                                                            </span>
                                                        ) : assignment.alert === "overdue" ? (
                                                            <span className="ui-badge ui-badge--error">Past due</span>
                                                        ) : (
                                                            <span className="ui-muted">On track</span>
                                                        )}
                                                    </td>
                                                    <td className="progress-actions">
                                                        <button
                                                            type="button"
                                                            className={`ui-button ui-button--small${open ? "" : " ui-button--secondary"}`}
                                                            disabled={!["submitted", "signed"].includes(assignment.encounter_status)}
                                                            aria-expanded={open}
                                                            onClick={() => setSelected(open ? null : assignment.assignment_id)}
                                                        >
                                                            {open ? "Close" : "Grade"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>

                    {selectedAssignment && (
                        <div ref={editorRef} className="progress-editor">
                            <GradeEditor
                                key={selectedAssignment.assignment_id}
                                assignmentId={selectedAssignment.assignment_id}
                                encounterStatus={selectedAssignment.encounter_status}
                            />
                        </div>
                    )}

                    {scoreRows.length > 0 && (
                        <Panel
                            title="Published scores by student"
                            description="Points-based summary across published graded cases only; not an official course grade."
                        >
                            <ScoreBars
                                label="Published score percentage by student"
                                items={scoreRows
                                    .filter(([, score]) => score.possible > 0)
                                    .map(([id, score]) => ({
                                        key: id,
                                        label: score.name,
                                        value: (score.earned / score.possible) * 100,
                                        detail: `${score.earned.toFixed(2)} / ${score.possible.toFixed(2)} points`,
                                    }))}
                            />

                            <div className="ui-table-wrap progress-scores">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th className="ui-num">Cases graded</th>
                                            <th className="ui-num">Earned</th>
                                            <th className="ui-num">Possible</th>
                                            <th className="ui-num">Percentage</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {scoreRows.map(([id, score]) => (
                                            <tr key={id}>
                                                <td className="progress-student">{score.name}</td>
                                                <td className="ui-num">{score.count}</td>
                                                <td className="ui-num">{score.earned.toFixed(2)}</td>
                                                <td className="ui-num">{score.possible.toFixed(2)}</td>
                                                <td className="ui-num">
                                                    {score.possible
                                                        ? `${((score.earned / score.possible) * 100).toFixed(1)}%`
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Panel>
                    )}
                </>
            )}
        </div>
    );
}
