import { useEffect, useState } from "react";

import { gradesApi } from "../../api/grades";

import type {
    Grade,
    GradeCriterion,
    GradeSave,
} from "../../api/grades";

import "./grades.css";


interface Props {
    assignmentId: number;
    encounterStatus: string;
}


const starter: GradeCriterion[] = [
    "Subjective",
    "Objective",
    "Assessment",
    "Plan",
].map((label, index) => ({
    criterion_key: `soap-${index + 1}`,
    label,
    possible_points: 10,
    earned_points: 0,
    comment: null,
}));


export function GradeEditor({
    assignmentId,
    encounterStatus,
}: Props) {
    const [grade, setGrade] = useState<Grade | null>(null);

    const [items, setItems] =
        useState<GradeCriterion[]>(starter);

    const [adjustment, setAdjustment] = useState(0);
    const [reason, setReason] = useState("");

    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [dirty, setDirty] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);


    useEffect(() => {
        let live = true;

        setLoading(true);
        setLoadFailed(false);

        gradesApi.one(assignmentId)
            .then((value) => {
                if (!live) return;

                setGrade(value);

                setItems(
                    value?.items ??
                    starter.map((item) => ({ ...item }))
                );

                setAdjustment(
                    value?.adjustment_points ?? 0
                );

                setReason(
                    value?.adjustment_reason ?? ""
                );

                setDirty(false);
                setError("");
            })
            .catch((err: Error) => {
                if (live) {
                    setError(err.message);
                    setLoadFailed(true);
                }
            })
            .finally(() => {
                if (live) setLoading(false);
            });

        return () => {
            live = false;
        };
    }, [assignmentId]);


    // Update one rubric criterion without changing the others.
    const changeItem = (
        index: number,
        patch: Partial<GradeCriterion>,
    ) => {
        setItems((previous) =>
            previous.map((item, n) =>
                n === index
                    ? { ...item, ...patch }
                    : item
            )
        );

        setDirty(true);
    };


    // Find the next unused identifier for a custom criterion.
    const addItem = () => {
        let next = 1;

        while (
            items.some(
                (item) =>
                    item.criterion_key === `manual-${next}`
            )
        ) {
            next += 1;
        }

        setItems((previous) => [
            ...previous,
            {
                criterion_key: `manual-${next}`,
                label: "",
                possible_points: 10,
                earned_points: 0,
                comment: null,
            },
        ]);

        setDirty(true);
    };


    const save = async () => {
        setError("");
        setMessage("");

        if (
            !items.length ||
            items.some(
                (item) =>
                    !item.label.trim() ||
                    item.possible_points <= 0 ||
                    item.earned_points < 0 ||
                    item.earned_points > item.possible_points
            )
        ) {
            setError(
                "Each criterion needs a name and valid points (0 to possible)."
            );
            return;
        }

        if (adjustment !== 0 && !reason.trim()) {
            setError(
                "Explain any adjustment to the rubric score."
            );
            return;
        }

        const payload: GradeSave = {
            items,
            adjustment_points: adjustment,
            adjustment_reason: reason || null,
        };

        setBusy(true);

        try {
            const updated = await gradesApi.save(
                assignmentId,
                payload
            );

            setGrade(updated);
            setDirty(false);

            setMessage(
                "Draft score saved. Publish after the assignment is signed."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save score"
            );
        } finally {
            setBusy(false);
        }
    };


    const publish = async () => {
        setBusy(true);
        setError("");
        setMessage("");

        try {
            const updated = await gradesApi.publish(
                assignmentId
            );

            setGrade(updated);

            setMessage(
                "Grade published to the student."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to publish grade"
            );
        } finally {
            setBusy(false);
        }
    };


    const possible = items.reduce(
        (total, item) =>
            total + Number(item.possible_points),
        0
    );

    const earned = items.reduce(
        (total, item) =>
            total + Number(item.earned_points),
        0
    );


    return (
        <section className="grades-panel">
            <h2>Assignment grade</h2>

            <p className="ui-muted">
                Edit the rubric sections for this case.
                Scores are saved as a draft until published.
            </p>

            {loading ? (
                <p>Loading grade...</p>
            ) : loadFailed ? (
                <p className="ui-error" role="alert">
                    Could not load the saved grade: {error}.
                    Close and reopen this assignment to retry.
                </p>
            ) : (
                <>
                    <div className="grades-table-wrap">
                        <table className="grades-table">
                            <thead>
                                <tr>
                                    <th>Criterion</th>
                                    <th>Possible</th>
                                    <th>Awarded</th>
                                    <th>Notes</th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.criterion_key}>
                                        <td>
                                            <input
                                                aria-label="Criterion"
                                                value={item.label}
                                                onChange={(e) =>
                                                    changeItem(index, {
                                                        label: e.target.value,
                                                    })
                                                }
                                            />
                                        </td>

                                        <td>
                                            <input
                                                aria-label="Possible points"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.possible_points}
                                                onChange={(e) =>
                                                    changeItem(index, {
                                                        possible_points:
                                                            Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </td>

                                        <td>
                                            <input
                                                aria-label="Awarded points"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.earned_points}
                                                onChange={(e) =>
                                                    changeItem(index, {
                                                        earned_points:
                                                            Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </td>

                                        <td>
                                            <input
                                                aria-label="Criterion comment"
                                                value={item.comment ?? ""}
                                                onChange={(e) =>
                                                    changeItem(index, {
                                                        comment: e.target.value,
                                                    })
                                                }
                                            />
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setItems((previous) =>
                                                        previous.filter(
                                                            (_, n) => n !== index
                                                        )
                                                    );

                                                    setDirty(true);
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                    >
                        Add criterion
                    </button>

                    <div className="grades-adjust">
                        <label>
                            Adjustment (points)

                            <input
                                type="number"
                                step="0.01"
                                value={adjustment}
                                onChange={(e) => {
                                    setAdjustment(
                                        Number(e.target.value)
                                    );

                                    setDirty(true);
                                }}
                            />
                        </label>

                        <label>
                            Justification

                            <input
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setDirty(true);
                                }}
                                placeholder="Required for adjustments"
                            />
                        </label>
                    </div>

                    <p>
                        <strong>
                            Score:{" "}
                            {(earned + adjustment).toFixed(2)}
                            {" / "}
                            {possible.toFixed(2)} points
                        </strong>
                    </p>

                    <p className="ui-muted">
                        {grade?.published_at
                            ? "Published"
                            : "Not published"}

                        {dirty
                            ? " · Unsaved changes"
                            : ""}
                    </p>

                    {error && (
                        <p
                            className="ui-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {message && (
                        <p role="status">
                            {message}
                        </p>
                    )}

                    <div className="grades-actions">
                        <button
                            type="button"
                            disabled={
                                busy ||
                                (!!grade && !dirty)
                            }
                            onClick={save}
                        >
                            Save grade draft
                        </button>

                        <button
                            type="button"
                            disabled={
                                busy ||
                                !grade ||
                                dirty ||
                                encounterStatus !== "signed" ||
                                !!grade.published_at
                            }
                            onClick={publish}
                        >
                            Publish grade
                        </button>
                    </div>

                    {encounterStatus !== "signed" && (
                        <p className="ui-muted">
                            The assignment must be signed off
                            before publishing its grade.
                        </p>
                    )}
                </>
            )}
        </section>
    );
}