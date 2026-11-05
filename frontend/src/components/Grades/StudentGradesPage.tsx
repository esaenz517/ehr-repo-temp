import { useEffect, useState } from "react";

import { gradesApi } from "../../api/grades";
import type { Grade } from "../../api/grades";

import { ScoreBars, ScoreRing } from "../Charts/Charts";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import "./grades.css";


export function StudentGradesPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        gradesApi.student()
            .then(setGrades)
            .catch((err: Error) =>
                setError(err.message)
            )
            .finally(() =>
                setLoading(false)
            );
    }, []);


    // Practice assignments are excluded from the average.
    const graded = grades.filter(
        (grade) =>
            grade.assignment_type === "graded"
    );

    const points = graded.reduce(
        (total, grade) =>
            total + grade.final_points,
        0
    );

    const possible = graded.reduce(
        (total, grade) =>
            total + grade.possible_points,
        0
    );


    return (
        <div className="ui-page">
            <PageHeader
                title="My Grades"
                description="Only instructor-published grades appear here. Practice cases do not affect the points-based average."
            />

            {error && (
                <p className="ui-error" role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="ui-row-empty">Loading grades…</p>
            ) : error ? null : (
                <>
                    <Panel>
                        <div className="grades-summary">
                            <ScoreRing
                                value={possible ? (points / possible) * 100 : null}
                                label="Average"
                            />

                            <div className="grades-summary-text">
                                <strong>
                                    {possible
                                        ? `${((points / possible) * 100).toFixed(1)}%`
                                        : "No graded scores yet"}
                                </strong>

                                <span className="ui-muted">
                                    {possible
                                        ? `${points.toFixed(2)} of ${possible.toFixed(2)} points earned across graded cases`
                                        : "Your instructor has not published a graded case score."}
                                </span>
                            </div>
                        </div>
                    </Panel>

                    {grades.length > 0 && (
                        <Panel title="Score by case" description="Each published case as a percentage of its points.">
                            <ScoreBars
                                label="Score percentage by case"
                                items={grades.map((grade) => ({
                                    key: grade.assignment_id,
                                    label: `Case #${grade.case_id}${grade.assignment_type === "practice" ? " (practice)" : ""}`,
                                    value: grade.percentage,
                                    detail: `${grade.final_points.toFixed(2)} / ${grade.possible_points.toFixed(2)} points`,
                                }))}
                            />
                        </Panel>
                    )}

                    <Panel
                        title="Case breakdown"
                        description="Open a case to see the points and notes for each rubric criterion."
                        flush
                    >
                        {!grades.length ? (
                            <p className="ui-row-empty">No published grades yet.</p>
                        ) : (
                            grades.map((grade) => (
                                <details className="grades-case" key={grade.assignment_id}>
                                    <summary className="grades-case-summary">
                                        <span className="grades-case-title">
                                            Case #{grade.case_id}
                                            <span className="grades-case-course">{grade.course ?? "No course"}</span>
                                        </span>
                                        {grade.assignment_type === "practice" && (
                                            <span className="ui-badge ui-badge--muted">Practice</span>
                                        )}
                                        <span className="grades-case-score">
                                            {grade.final_points.toFixed(2)} / {grade.possible_points.toFixed(2)}
                                            <span className="ui-muted"> ({grade.percentage.toFixed(1)}%)</span>
                                        </span>
                                    </summary>

                                    <div className="grades-case-body">
                                        <div className="ui-table-wrap">
                                            <table className="ui-table grades-table">
                                                <thead>
                                                    <tr>
                                                        <th>Rubric criterion</th>
                                                        <th className="ui-num">Earned</th>
                                                        <th className="ui-num">Possible</th>
                                                        <th>Instructor notes</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {grade.items.map((item) => (
                                                        <tr key={item.criterion_key}>
                                                            <td>{item.label}</td>
                                                            <td className="ui-num">{item.earned_points.toFixed(2)}</td>
                                                            <td className="ui-num">{item.possible_points.toFixed(2)}</td>
                                                            <td>{item.comment ?? "—"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {grade.adjustment_points !== 0 && (
                                            <p className="grades-adjustment">
                                                Adjustment: {grade.adjustment_points > 0 ? "+" : ""}
                                                {grade.adjustment_points.toFixed(2)} · {grade.adjustment_reason}
                                            </p>
                                        )}
                                    </div>
                                </details>
                            ))
                        )}
                    </Panel>
                </>
            )}
        </div>
    );
}
