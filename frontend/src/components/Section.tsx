import type { ReactNode } from "react";
import { Panel } from "./Panel";

// One titled section of a detail page (case workspace). Same look as every other Panel.
// `overflow` lets sticky bars and autocomplete dropdowns inside work (SOAP note).
export function Section({
  title, actions, overflow, children,
}: { title: string; actions?: ReactNode; overflow?: boolean; children?: ReactNode }) {
  return (
    <Panel title={title} actions={actions} overflow={overflow}>
      {children}
    </Panel>
  );
}
