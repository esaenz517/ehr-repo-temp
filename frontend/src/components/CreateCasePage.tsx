import { FormEvent, ReactNode } from "react";
import { useCreateCase } from "../hooks/useCreateCase";
import { useDrugs } from "../hooks/useDrugs";
import { CaseContent } from "./Cases/CaseContent";
import { ChartData } from "./Cases/ChartData";
import { PatientDemographics } from "./Patients/PatientDemographics";
import { CasePatientSelector } from "./Patients/CasePatientSelector";
import { AssignmentSection } from "./Assignment/AssignmentSection";

// One boxed section of the form, with its title in the border.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset style={{ border: "1px solid #ddd", borderRadius: 4, marginBottom: 16, padding: 16 }}>
      <legend style={{ fontWeight: 600, padding: "0 4px" }}>{title}</legend>
      {children}
    </fieldset>
  );
}

interface CreateCasePageProps {
  staffId: number; // the logged-in instructor; saved as the case's creator
}

// Instructor workflow: create a case.
// Sections that are done render their component. The rest show a placeholder.
// To fill in a section: build its component (see Cases/CaseContent.tsx),
// add its state to hooks/useCreateCase.ts, then replace its <ComingSoon> below.
export function CreateCasePage({ staffId }: CreateCasePageProps) {
  const createCase = useCreateCase();
  const { drugs } = useDrugs(); // drug list for the Medications checkboxes

  // Runs when the "Create case" button is pressed.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser from reloading the page
    createCase.submit(staffId);
  };

  return (
    // noValidate: we show our own error messages instead of the browser's pop-ups.
    <form onSubmit={handleSubmit} noValidate>
      <h1>Create Case</h1>

      {/* Success and error messages from the last save */}
      {createCase.created && (
        <p className="form-message success">
          Case #{createCase.created.case_id} created
          {createCase.created.patient &&
            ` for ${createCase.created.patient.first_name} ${createCase.created.patient.last_name}`}
          .
        </p>
      )}
      {createCase.error && <p className="form-message error">{createCase.error}</p>}

      <Section title="Start Form">
        <CasePatientSelector
          patients={createCase.patients}
          loading={createCase.patientsLoading}
          error={createCase.fieldErrors.patient}
          loadError={createCase.patientsError}
          patientMode={createCase.patientMode}
          selectedPatientId={createCase.selectedPatientId}
          loadingPatient={createCase.loadingPatient}
          onSelectExisting={createCase.selectExistingPatient}
          onSelectNew={createCase.selectNewPatient}
        />
      </Section>

      <Section title="Patient Demographics">
        <PatientDemographics
          values={createCase.demographics}
          onChange={createCase.updateDemographics}
          errors={createCase.fieldErrors}
          readOnly={createCase.patientMode == "existing"}
        />
      </Section>

      <Section title="Case Content">
        <CaseContent
          values={createCase.caseContent}
          onChange={createCase.updateCaseContent}
          errors={createCase.fieldErrors}
        />
      </Section>

      <Section title="Chart Data">
        <ChartData
          values={createCase.chartData}
          drugs={drugs}
          onChange={createCase.setChartData}
          errors={createCase.fieldErrors}
          readOnly={createCase.patientMode == "existing"}
        />
      </Section>

      <Section title="Assignment">
        <AssignmentSection values={createCase.assignment} onChange={createCase.updateAssignment} />
      </Section>

      <button type="submit" disabled={createCase.submitting}>
        {createCase.submitting ? "Creating…" : "Create case"}
      </button>
    </form>
  );
}
