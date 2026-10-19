import { useEffect, useState } from "react";

import { gradesApi } from "../../api/grades";
import type { Grade } from "../../api/grades";

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
        <div className="ui-page grades-page">
            <h1>My Grades</h1>

            <p className="ui-muted">
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
                <p>Loading grades...</p>
            ) : error ? null : (
                <>
                    <section className="grades-summary">
                        <strong>
                            {possible
                                ? `${(
                                    (points / possible) * 100
                                ).toFixed(1)}%`
                                : "No graded scores yet"}
                        </strong>

                        <span>
                            {possible
                                ? `${points.toFixed(2)} of ${possible.toFixed(2)} points earned across graded cases`
                                : "Your instructor has not published a graded case score."}
                        </span>
                    </section>

                    {!grades.length && (
                        <p>No published grades yet.</p>
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

                            <table className="grades-table">
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