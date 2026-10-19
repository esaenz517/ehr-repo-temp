import { useEffect, useState } from "react";
import { rubricApi } from "../../api/rubric";
import type { AssignmentGrade } from "../../types";
import { RUBRIC_CATEGORY_LABELS } from "../Cases/RubricEditor";
import "./rubric.css";

//AI was used to assist in building this section as dev assigned to it is
// unfamiliar with frontend development.

interface GradeBreakdownProps {
  assignmentId: number;
}

// Student's grade once the instructor signs off: the total, then each rubric item
// with the points earned and the instructor's comment. Shows nothing before sign-off
// (the server doesn't send the rubric until then) or when the case has no rubric.
export function GradeBreakdown({ assignmentId }: GradeBreakdownProps) {
  const [grade, setGrade] = useState<AssignmentGrade | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    rubricApi
      .grade(assignmentId)
      .then((g) => !cancelled && setGrade(g))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load grade"));
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  if (error) return <p className="ui-error">{error}</p>;
  if (!grade || !grade.released || grade.items.length === 0) return null;

  const earned = grade.points_awarded ?? 0;
  const total = grade.total_points ?? 0;

  return (
    <section className="rubric">
      <div className="rubric-header">
        <h2>Your grade</h2>
        <span className="rubric-total">
          {earned} / {total} ({total > 0 ? Math.round((earned / total) * 100) : 0}%)
        </span>
      </div>
      <ol className="rubric-list">
        {grade.items.map((item) => {
          const got = item.points_awarded ?? 0;
          const result = got === item.points ? "full" : got === 0 ? "none" : "partial";
          return (
            <li key={item.rubric_item_id} className={`rubric-item rubric-item--${result}`}>
              <div className="rubric-item-main">
                <span className={`rubric-tag rubric-tag--${item.category}`}>{RUBRIC_CATEGORY_LABELS[item.category]}</span>
                <span className="rubric-label">{item.label}</span>
                <span className="rubric-earned">{got} / {item.points}</span>
              </div>
              {item.comment && <p className="rubric-comment-text">{item.comment}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
