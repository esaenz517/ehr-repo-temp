import { useEffect, useState } from "react";

import { gradesApi } from "../../api/grades";
import type { Grade } from "../../api/grades";

import { ScoreBars, ScoreRing } from "../Charts/Charts";
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
            <h1 className="ui-page-title">My Grades</h1>

            <p className="ui-page-intro">
                Only instructor-published grades appear here.
                Practice cases do not affect the
                points-based average.
            </p>

            {error && (
                <p className="ui-error" role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="ui-muted">Loading grades...</p>
            ) : error ? null : (
                <>
                    <section className="ui-card grades-summary">
                        <ScoreRing
                            value={possible ? (points / possible) * 100 : null}
                            label="Average"
                        />

                        <div className="grades-summary-text">
                            <strong>
                                {possible
                                    ? `${(
                                        (points / possible) * 100
                                    ).toFixed(1)}%`
                                    : "No graded scores yet"}
                            </strong>

                            <span className="ui-muted">
                                {possible
                                    ? `${points.toFixed(2)} of ${possible.toFixed(2)} points earned across graded cases`
                                    : "Your instructor has not published a graded case score."}
                            </span>
                        </div>
                    </section>

                    {grades.length > 0 && (
                        <section className="ui-card">
                            <h2 className="ui-card-title">Score by case</h2>
                            <p className="ui-muted">Each published case as a percentage of its points.</p>
                            <ScoreBars
                                label="Score percentage by case"
                                items={grades.map((grade) => ({
                                    key: grade.assignment_id,
                                    label: `Case #${grade.case_id}${grade.assignment_type === "practice" ? " (practice)" : ""}`,
                                    value: grade.percentage,
                                    detail: `${grade.final_points.toFixed(2)} / ${grade.possible_points.toFixed(2)} points`,
                                }))}
                            />
                        </section>
                    )}

                    {!grades.length && (
                        <p className="ui-row-empty">No published grades yet.</p>
                    )}

                    {grades.map((grade) => (
                        <details
                            className="grades-panel"
                            key={grade.assignment_id}
                        >
                            <summary>
                                <strong>
                                    Case #{grade.case_id}
                                </strong>

                                {" · "}
                                {grade.course ?? "No course"}
                                {" · "}

                                <strong>
                                    {grade.final_points.toFixed(2)}
                                    {" / "}
                                    {grade.possible_points.toFixed(2)}
                                </strong>

                                {" "}
                                ({grade.percentage.toFixed(1)}%)

                                {grade.assignment_type === "practice"
                                    ? " · Practice"
                                    : ""}
                            </summary>

                            <div className="ui-table-wrap">
                            <table className="ui-table grades-table">
                                <thead>
                                    <tr>
                                        <th>Rubric criterion</th>
                                        <th>Earned</th>
                                        <th>Possible</th>
                                        <th>Instructor notes</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {grade.items.map((item) => (
                                        <tr key={item.criterion_key}>
                                            <td>{item.label}</td>

                                            <td>
                                                {item.earned_points.toFixed(2)}
                                            </td>

                                            <td>
                                                {item.possible_points.toFixed(2)}
                                            </td>

                                            <td>
                                                {item.comment ?? "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>

                            {grade.adjustment_points !== 0 && (
                                <p>
                                    Adjustment:{" "}
                                    {grade.adjustment_points > 0
                                        ? "+"
                                        : ""}

                                    {grade.adjustment_points.toFixed(2)}
                                    {" · "}
                                    {grade.adjustment_reason}
                                </p>
                            )}
                        </details>
                    ))}
                </>
            )}
        </div>
    );
}