import type { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode; // grey line under the title
  actions?: ReactNode; // buttons/badges on the right of the header
  toolbar?: ReactNode; // strip under the header (filters)
  footer?: ReactNode; // button row at the bottom
  flush?: boolean; // body has no padding: for tables and row lists
  overflow?: boolean; // let dropdowns (autocomplete) spill outside the panel
  className?: string;
  id?: string;
  children?: ReactNode;
}

// A white card with an optional titled header, the content, and an optional footer.
// Every boxed block on every page is a Panel, so they all share one look.
export function Panel({
  title, description, actions, toolbar, footer, flush = false, overflow = false, className, id, children,
}: PanelProps) {
  const classes = ["ui-panel", overflow && "ui-panel--overflow", className].filter(Boolean).join(" ");
  return (
    <section className={classes} id={id}>
      {(title || actions) && (
        <header className="ui-panel-header">
          <div className="ui-panel-heading">
            {title && <h2 className="ui-panel-title">{title}</h2>}
            {description && <p className="ui-panel-description">{description}</p>}
          </div>
          {actions && <div className="ui-panel-actions">{actions}</div>}
        </header>
      )}
      {toolbar}
      {children !== undefined && children !== null && children !== false && (
        <div className={flush ? "ui-panel-body ui-panel-body--flush" : "ui-panel-body"}>{children}</div>
      )}
      {footer && <div className="ui-panel-footer">{footer}</div>}
    </section>
  );
}
