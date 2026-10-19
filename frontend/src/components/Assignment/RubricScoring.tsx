import { useCallback, useEffect, useState } from "react";
import { rubricApi } from "../../api/rubric";
import type { Assignment, AssignmentGrade } from "../../types";
import { RUBRIC_CATEGORY_LABELS } from "../Cases/RubricEditor";
import "./rubric.css";

// What the instructor has typed for one item (points is the input's text; "" = not scored)
interface Draft {
  points: string;
  comment: string;
}

interface RubricScoringProps {
  assignment: Assignment;
  // Tells the parent why Sign off must wait (null when it can go ahead)
  onSignOffBlocked: (reason: string | null) => void;
}

function draftsFrom(grade: AssignmentGrade): Record<number, Draft> {
  const drafts: Record<number, Draft> = {};
  for (const item of grade.items) {
    drafts[item.rubric_item_id] = {
      points: item.points_awarded === null ? "" : String(item.points_awarded),
      comment: item.comment ?? "",
    };
  }
  return drafts;
}

// Points as a whole number from 0 to max, null when blank, or "invalid".
function readPoints(text: string, max: number): number | null | "invalid" {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : "invalid";
}

const percent = (earned: number, total: number) => (total > 0 ? Math.round((earned / total) * 100) : 0);

// Instructor's rubric checklist under a student's note: score each item, then sign off.
// Scores can be entered on submitted or signed work; once sent back they're read-only
// until the student resubmits.
export function RubricScoring({ assignment, onSignOffBlocked }: RubricScoringProps) {
  const [grade, setGrade] = useState<AssignmentGrade | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const status = assignment.encounter_status;
  const editable = status === "submitted" || status === "signed";

  const load = useCallback(async () => {
    try {
      const g = await rubricApi.grade(assignment.assignment_id);
      setGrade(g);
      setDrafts(draftsFrom(g));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rubric");
    }
  }, [assignment.assignment_id]);

  // Reload when a different assignment opens or its status changes (e.g. after sign off)
  useEffect(() => {
    load();
  }, [load, status]);

  const items = grade?.items ?? [];

  // Compare what's typed with what's saved
  const dirty = items.some((item) => {
    const d = drafts[item.rubric_item_id];
    if (!d) return false;
    const saved = item.points_awarded === null ? "" : String(item.points_awarded);
    return d.points.trim() !== saved || d.comment.trim() !== (item.comment ?? "");
  });
  const invalid = items.find((item) => readPoints(drafts[item.rubric_item_id]?.points ?? "", item.points) === "invalid");
  const unscored = items.filter((item) => item.points_awarded === null).length;

  // Tell the parent whether Sign off can go ahead
  useEffect(() => {
    if (!grade) onSignOffBlocked("Loading rubric…");
    else if (items.length === 0) onSignOffBlocked(null);
    else if (dirty) onSignOffBlocked("Save your rubric scores before signing off.");
    else if (unscored > 0) onSignOffBlocked(`Score every rubric item before signing off (${unscored} left).`);
    else onSignOffBlocked(null);
  }, [grade, items.length, dirty, unscored, onSignOffBlocked]);

  if (status === "not_started" || (grade && items.length === 0)) return null;
  if (!grade) return error ? <p className="ui-error">{error}</p> : <p className="ui-muted">Loading rubric…</p>;

  const setDraft = (id: number, field: keyof Draft, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setMessage(null);
  };

  // Running total uses what's typed, so the instructor sees the grade as they go
  const typedTotal = items.reduce((sum, item) => {
    const p = readPoints(drafts[item.rubric_item_id]?.points ?? "", item.points);
    return sum + (typeof p === "number" ? p : 0);
  }, 0);
  const totalPoints = grade.total_points ?? 0;

  const save = async () => {
    // Only items with points typed in are sent; blank ones stay unscored
    const scores = items.flatMap((item) => {
      const d = drafts[item.rubric_item_id];
      const p = readPoints(d.points, item.points);
      return typeof p === "number"
        ? [{ rubric_item_id: item.rubric_item_id, points_awarded: p, comment: d.comment.trim() || null }]
        : [];
    });
    setSaving(true);
    setMessage(null);
    try {
      const g = await rubricApi.saveScores(assignment.assignment_id, scores);
      setGrade(g);
      setDrafts(draftsFrom(g));
      setError(null);
      setMessage("Rubric scores saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rubric">
      <div className="rubric-header">
        <h2>Grading rubric</h2>
        <span className="rubric-total">
          {typedTotal} / {totalPoints} ({percent(typedTotal, totalPoints)}%)
        </span>
      </div>
      {!editable && (
        <p className="ui-muted">Sent back to the student. You can rescore once they resubmit.</p>
      )}

      <ol className="rubric-list">
        {items.map((item) => {
          const d = drafts[item.rubric_item_id] ?? { points: "", comment: "" };
          const bad = readPoints(d.points, item.points) === "invalid";
          return (
            <li key={item.rubric_item_id} className="rubric-item">
              <div className="rubric-item-main">
                <span className={`rubric-tag rubric-tag--${item.category}`}>{RUBRIC_CATEGORY_LABELS[item.category]}</span>
                <span className="rubric-label">{item.label}</span>
              </div>
              {item.guidance && <p className="rubric-guidance">Grading notes: {item.guidance}</p>}

              <div className="rubric-score-row">
                <label className="rubric-points">
                  <input
                    type="number"
                    min={0}
                    max={item.points}
                    step={1}
                    aria-label={`Points for ${item.label}`}
                    className={`ui-input${bad ? " rubric-input--bad" : ""}`}
                    value={d.points}
                    disabled={!editable || saving}
                    onChange={(e) => setDraft(item.rubric_item_id, "points", e.target.value)}
                  />
                  <span>/ {item.points}</span>
                </label>
                {editable && (
                  <>
                    <button type="button" className="ui-button ui-button--secondary" disabled={saving}
                      onClick={() => setDraft(item.rubric_item_id, "points", String(item.points))}>
                      Full
                    </button>
                    <button type="button" className="ui-button ui-button--secondary" disabled={saving}
                      onClick={() => setDraft(item.rubric_item_id, "points", "0")}>
                      None
                    </button>
                  </>
                )}
                <input
                  className="ui-input rubric-comment"
                  placeholder="Comment for the student (optional)"
                  aria-label={`Comment for ${item.label}`}
                  maxLength={1000}
                  value={d.comment}
                  disabled={!editable || saving}
                  onChange={(e) => setDraft(item.rubric_item_id, "comment", e.target.value)}
                />
              </div>
              {bad && <p className="ui-error">Enter a whole number from 0 to {item.points}.</p>}
            </li>
          );
        })}
      </ol>

      {error && <p className="ui-error">{error}</p>}
      {message && <p className="assignment-note-message">{message}</p>}

      {editable && (
        <div className="assignment-feedback-actions">
          <span className="ui-muted rubric-status">
            {unscored > 0 ? `${unscored} of ${items.length} items not scored yet` : "All items scored"}
          </span>
          <button type="button" className="ui-button" disabled={saving || !dirty || !!invalid} onClick={save}>
            {saving ? "Saving…" : "Save scores"}
          </button>
        </div>
      )}
    </section>
  );
}
