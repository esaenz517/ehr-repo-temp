import type { ReactNode } from "react";
import "./cases.css";

interface RowGroupProps {
  title: string;
  count: number;
  columns: string[]; // labels shown above the rows
  layout: "meds" | "allergies" | "labs" | "rubric"; // picks the column widths in cases.css
  emptyText: string;
  addLabel: string;
  onAdd: () => void;
  readOnly?: boolean; // hides Add and the Remove column
  extra?: ReactNode; // shown next to the title (e.g. rubric point total)
  error?: string;
  children: ReactNode; // one .case-grid-row per item
}

// A titled list of editable rows (medications, allergies, labs, rubric items):
// header with an Add button, column labels, the rows, or an empty message.
export function RowGroup({
  title, count, columns, layout, emptyText, addLabel, onAdd, readOnly = false, extra, error, children,
}: RowGroupProps) {
  return (
    <div className="case-group">
      <div className="case-group-header">
        <h3 className="case-group-title">
          {title}
          {extra && <span className="case-group-extra">{extra}</span>}
        </h3>
        {/* type="button" so it doesn't submit the whole form */}
        {!readOnly && (
          <button type="button" className="ui-button ui-button--secondary ui-button--small" onClick={onAdd}>
            + {addLabel}
          </button>
        )}
      </div>

      {count === 0 ? (
        <p className="case-empty">{emptyText}</p>
      ) : (
        <div className={`case-grid case-cols--${layout}${readOnly ? " case-grid--readonly" : " case-grid--editable"}`}>
          <div className="case-grid-head" aria-hidden="true">
            {columns.map((c) => <span key={c}>{c}</span>)}
            {!readOnly && <span />}
          </div>
          {children}
        </div>
      )}
      {error && <p className="field-error case-group-error">{error}</p>}
    </div>
  );
}

// Text cell for a read-only row. data-label shows the column name on phones.
export function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="case-cell" data-label={label}>
      {children || <span className="ui-muted">—</span>}
    </span>
  );
}

// Remove button at the end of an editable row.
export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="ui-button ui-button--danger ui-button--small" aria-label={label} onClick={onClick}>
      Remove
    </button>
  );
}
