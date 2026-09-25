import { ReactNode } from "react";
import { PatientDemographics } from "./Patients/PatientDemographics";

// Instructor workflow: create a case. Each section renders its `content`
// component if it has one, otherwise a "coming soon" placeholder. To fill in
// another section, build its component and set `content` on its entry below.
// Once sections need to share values (e.g. for submit), lift their state into
// a useCreateCase hook (see hooks/useRooms.ts) and pass it down as props.
const SECTIONS: { title: string; description?: string; content?: ReactNode }[] = [
  { title: "Start Form", description: "Start from an existing case or build a new patient." },
  { title: "Patient Demographics", content: <PatientDemographics /> },
  { title: "Case Content", description: "Chief complaint and case narrative / HPI seed." },
  { title: "Chart Data", description: "Medications, allergies, and labs." },
  { title: "Assignment", description: "Encounter status, course, due date, mode, and students." },
];

export function CreateCasePage() {
  return (
    <div>
      <h1>Create Case</h1>

      {SECTIONS.map(({ title, description, content }) => (
        <fieldset
          key={title}
          style={{ border: "1px solid #ddd", borderRadius: 4, marginBottom: 16, padding: 16 }}
        >
          <legend style={{ fontWeight: 600, padding: "0 4px" }}>{title}</legend>
          {content ?? <p style={{ margin: 0, color: "#888" }}>{description} (coming soon)</p>}
        </fieldset>
      ))}

      <button type="button" disabled>
        Create case
      </button>
    </div>
  );
}
