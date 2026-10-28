import type { ReactNode } from "react";

// One boxed section of a page, with its title in the border.
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="ui-section">
      <legend className="ui-section-title">{title}</legend>
      {children}
    </fieldset>
  );
}
