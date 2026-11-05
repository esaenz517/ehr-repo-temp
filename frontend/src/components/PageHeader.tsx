import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode; // grey line under the title
  actions?: ReactNode; // buttons/filters on the right
  back?: { label: string; onClick: () => void }; // "← Back to ..." link above the title
}

// The top of every page: title and intro on the left, page-level buttons on the right,
// with a divider underneath. Using it on every page keeps headers identical.
export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-heading">
        {back && (
          <button type="button" className="ui-back" onClick={back.onClick}>
            ← Back to {back.label}
          </button>
        )}
        <h1 className="ui-page-title">{title}</h1>
        {description && <p className="ui-page-intro">{description}</p>}
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>
  );
}
