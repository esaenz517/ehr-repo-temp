import {
    useCallback,
    useEffect,
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

import "../Grades/grades.css";


function dateLabel(value: string | null) {
    return value
        ? new Date(
            value.endsWith("Z")
                ? value
                : `${value}Z`
        ).toLocaleString()
        : "—";
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


    return (
        <div className="ui-page">
            <h1 className="ui-page-title">Student Progress</h1>

            <p className="ui-page-intro">
                Based on saved SOAP notes and assignment status.
                Unsaved typing is not recorded as progress.
            </p>

            {error && (
                <p className="ui-error" role="alert">
                    {error}
                </p>
            )}

            {loading && !report ? (
                <p className="ui-muted">Loading progress...</p>
            ) : (
                <>
                    {report && (
                        <div
                            className="ui-stats"
                            aria-label="Assignment progress summary"
                        >
                            <div className="ui-stat">
                                <span className="ui-stat-value">{report.total}</span>
                                <span className="ui-stat-label">Total cases</span>
                            </div>

                            <div className="ui-stat ui-stat--accent">
                                <span className="ui-stat-value">{report.in_progress}</span>
                                <span className="ui-stat-label">In progress</span>
                            </div>

                            <div className="ui-stat ui-stat--success">
                                <span className="ui-stat-value">
                                    {report.submitted + report.signed}
                                </span>
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
                        <section className="ui-card">
                            <h2 className="ui-card-title">Where every case stands</h2>
                            <p className="ui-muted">Share of assigned cases in each status.</p>
                            <StatusBreakdown
                                counts={{
                                    not_started: report.not_started,
                                    in_progress: report.in_progress,
                                    submitted: report.submitted,
                                    signed: report.signed,
                                }}
                            />
                        </section>
                    )}

                    {report &&
                        (report.inactive > 0 ||
                            report.overdue > 0) && (
                            <p
                                className="progress-alert progress-alert-banner"
                                role="status"
                            >
                                Attention needed:{" "}
                                {report.inactive} inactive
                                assignment(s) and{" "}
                                {report.overdue} overdue
                                assignment(s).
                            </p>
                        )}

                    <div className="ui-toolbar">
                        <label className="ui-checkbox">
                            <input
                                type="checkbox"
                                checked={onlyAlerts}
                                onChange={(e) =>
                                    setOnlyAlerts(e.target.checked)
                                }
                            />

                            Show alerts only
                        </label>

                        <button
                            type="button"
                            className="ui-button ui-button--secondary"
                            onClick={() => {
                                void reload();
                            }}
                        >
                            Refresh
                        </button>
                    </div>

                    {report && !shown.length && (
                        <p className="ui-row-empty">
                            {onlyAlerts
                                ? "No current inactivity or overdue alerts."
                                : "No cases assigned by your account."}
                        </p>
                    )}

                    {shown.length > 0 && (
                        <div className="ui-table-card ui-table-wrap">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Case</th>
                                        <th>Course</th>
                                        <th>Status</th>
                                        <th>Due</th>
                                        <th>Last saved</th>
                                        <th>Grade</th>
                                        <th>Progress alert</th>
                                        <th />
                                    </tr>
                                </thead>

                                <tbody>
                                    {shown.map((assignment) => {
                                        const grade = gradeByAssignment.get(
                                            assignment.assignment_id
                                        );

                                        return (
                                            <tr key={assignment.assignment_id}>
                                                <td>
                                                    {assignment.student_name}
                                                </td>

                                                <td>
                                                    #{assignment.case_id}
                                                </td>

                                                <td>
                                                    {assignment.course ?? "—"}
                                                </td>

                                                <td>
                                                    <StatusBadge status={assignment.encounter_status} />
                                                </td>

                                                <td>
                                                    {dateLabel(assignment.due_date)}
                                                </td>

                                                <td>
                                                    {dateLabel(assignment.last_saved_at)}
                                                </td>

                                                <td>
                                                    {grade
                                                        ? `${grade.final_points.toFixed(2)} / ${grade.possible_points.toFixed(2)}${grade.published_at
                                                            ? ""
                                                            : " (draft)"
                                                        }`
                                                        : "Not graded"}
                                                </td>

                                                <td>
                                                    {assignment.alert === "inactive" ? (
                                                        <span className="progress-alert">
                                                            Inactive:{" "}
                                                            {assignment.idle_hours.toFixed(1)}
                                                            h without a saved note
                                                        </span>
                                                    ) : assignment.alert === "overdue" ? (
                                                        <span className="progress-alert">
                                                            Past due
                                                        </span>
                                                    ) : (
                                                        <span className="ui-muted">
                                                            On track
                                                        </span>
                                                    )}

                                                    {assignment.alert === "inactive" && (
                                                        <div className="ui-muted">
                                                            Threshold{" "}
                                                            {assignment.inactivity_threshold_hours?.toFixed(1)}
                                                            h
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="ui-button ui-button--secondary ui-button--small"
                                                        disabled={
                                                            ![
                                                                "submitted",
                                                                "signed",
                                                            ].includes(
                                                                assignment.encounter_status
                                                            )
                                                        }
                                                        onClick={() =>
                                                            setSelected(
                                                                selected === assignment.assignment_id
                                                                    ? null
                                                                    : assignment.assignment_id
                                                            )
                                                        }
                                                    >
                                                        {selected === assignment.assignment_id
                                                            ? "Close"
                                                            : "Grade"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {studentScores.size > 0 && (
                        <section className="ui-card">
                            <h2 className="ui-card-title">Published scores by student</h2>

                            <p className="ui-muted">
                                Points-based summary across published
                                graded cases only; not an official
                                course grade.
                            </p>

                            <ScoreBars
                                label="Published score percentage by student"
                                items={Array.from(studentScores.entries())
                                    .filter(([, score]) => score.possible > 0)
                                    .map(([id, score]) => ({
                                        key: id,
                                        label: score.name,
                                        value: (score.earned / score.possible) * 100,
                                        detail: `${score.earned.toFixed(2)} / ${score.possible.toFixed(2)} points`,
                                    }))}
                            />

                            <div className="ui-table-wrap">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Cases graded</th>
                                        <th>Earned</th>
                                        <th>Possible</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {Array.from(studentScores.entries()).map(
                                        ([id, score]) => (
                                            <tr key={id}>
                                                <td>{score.name}</td>

                                                <td>{score.count}</td>

                                                <td>
                                                    {score.earned.toFixed(2)}
                                                </td>

                                                <td>
                                                    {score.possible.toFixed(2)}
                                                </td>

                                                <td>
                                                    {score.possible
                                                        ? `${(
                                                            (score.earned /
                                                                score.possible) *
                                                            100
                                                        ).toFixed(1)}%`
                                                        : "—"}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </section>
                    )}

                    {selectedAssignment && (
                        <GradeEditor
                            key={selectedAssignment.assignment_id}
                            assignmentId={selectedAssignment.assignment_id}
                            encounterStatus={selectedAssignment.encounter_status}
                        />
                    )}
                </>
            )}
        </div>
    );
}