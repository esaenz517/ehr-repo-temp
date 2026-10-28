import type { EncounterStatus } from "../../types";
import { STATUS_LABELS } from "../StatusBadge";
import "./charts.css";

// Small dependency-free charts. Colors come from theme.css tokens, text always
// uses text colors (never the bar color), and every chart has a text alternative.

const STATUS_ORDER: EncounterStatus[] = ["not_started", "in_progress", "submitted", "signed"];

const percent = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

// One stacked bar split by assignment status, with a legend listing each count.
export function StatusBreakdown({ counts }: { counts: Record<EncounterStatus, number> }) {
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);
  const summary = STATUS_ORDER.map((s) => `${counts[s]} ${STATUS_LABELS[s].toLowerCase()}`).join(", ");

  return (
    <div className="chart-status">
      <div className="chart-stack" role="img" aria-label={`${total} cases: ${summary}`}>
        {total === 0 ? (
          <span className="chart-stack-empty" />
        ) : (
          STATUS_ORDER.map((s) =>
            counts[s] > 0 ? (
              <span
                key={s}
                className={`chart-stack-part chart-fill--${s}`}
                style={{ flexGrow: counts[s] }}
                title={`${STATUS_LABELS[s]}: ${counts[s]} (${percent(counts[s], total)}%)`}
              />
            ) : null
          )
        )}
      </div>
      <ul className="chart-legend">
        {STATUS_ORDER.map((s) => (
          <li key={s} className="chart-legend-item">
            <span className={`chart-swatch chart-fill--${s}`} aria-hidden="true" />
            <span>{STATUS_LABELS[s]}</span>
            <strong className="chart-legend-value">{counts[s]}</strong>
            <span className="ui-muted">({percent(counts[s], total)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ScoreBarItem {
  key: string | number;
  label: string;
  value: number; // percentage 0-100
  detail?: string; // shown in the tooltip, e.g. "8 / 10 points"
}

// Horizontal bars on a 0-100% scale, one per item, with the value at the tip.
export function ScoreBars({ items, label }: { items: ScoreBarItem[]; label: string }) {
  return (
    <ul className="chart-bars" aria-label={label}>
      {items.map((item) => {
        const width = Math.max(0, Math.min(100, item.value));
        return (
          <li key={item.key} className="chart-bar-row" title={item.detail ? `${item.label}: ${item.detail}` : undefined}>
            <span className="chart-bar-label">{item.label}</span>
            <span className="chart-bar-track" aria-hidden="true">
              <span className="chart-bar-fill" style={{ width: `${width}%` }} />
            </span>
            <span className="chart-bar-value">{item.value.toFixed(1)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

// Donut showing one percentage, with the number in the middle.
export function ScoreRing({ value, label }: { value: number | null; label: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const shown = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <figure className="chart-ring" role="img" aria-label={value === null ? `${label}: no score yet` : `${label}: ${shown.toFixed(1)}%`}>
      <svg viewBox="0 0 128 128" width="128" height="128" aria-hidden="true">
        <circle className="chart-ring-track" cx="64" cy="64" r={radius} />
        {value !== null && (
          <circle
            className="chart-ring-value"
            cx="64"
            cy="64"
            r={radius}
            strokeDasharray={`${(shown / 100) * circumference} ${circumference}`}
          />
        )}
      </svg>
      <figcaption className="chart-ring-text">
        <strong>{value === null ? "—" : `${shown.toFixed(1)}%`}</strong>
        <span>{label}</span>
      </figcaption>
    </figure>
  );
}
