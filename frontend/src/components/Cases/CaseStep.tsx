import type { ReactNode } from "react";
import "./cases.css";

interface CaseStepProps {
  number: number;
  title: string;
  children: ReactNode;
}

// One numbered card on the Create Case page.
export function CaseStep({ number, title, children }: CaseStepProps) {
  const id = `case-step-${number}`;
  return (
    <section className="case-step" aria-labelledby={id}>
      <header className="case-step-header">
        <span className="case-step-number" aria-hidden="true">{number}</span>
        <h2 id={id} className="case-step-title">{title}</h2>
      </header>
      <div className="case-step-body">{children}</div>
    </section>
  );
}
