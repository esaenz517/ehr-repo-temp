import { FormEvent, useEffect, useRef } from "react";
import { useCreateCase } from "../hooks/useCreateCase";
import { useDrugs } from "../hooks/useDrugs";
import { CaseContent } from "./Cases/CaseContent";
import { ChartData } from "./Cases/ChartData";
import { PatientDemographics } from "./Patients/PatientDemographics";
import { CasePatientSelector } from "./Patients/CasePatientSelector";
import { AssignmentSection } from "./Assignment/AssignmentSection";
import { RubricEditor } from "./Cases/RubricEditor";
import { CaseStep } from "./Cases/CaseStep";
import "./Cases/cases.css";

interface CreateCasePageProps {
  staffId: number; // the logged-in instructor; saved as the case's creator
}

// Instructor workflow: create a case. Each section is a numbered CaseStep card.
// To add a section: build its component (see Cases/CaseContent.tsx), add its
// state to hooks/useCreateCase.ts, then add a CaseStep below.
export function CreateCasePage({ staffId }: CreateCasePageProps) {
  const createCase = useCreateCase();
  const { drugs } = useDrugs(); // drug list for the Medications dropdowns
  const bannerRef = useRef<HTMLDivElement>(null);
  const existing = createCase.patientMode === "existing";

  // The Create button is at the bottom and the result shows at the top, so scroll to it.
  useEffect(() => {
    if (createCase.created || createCase.error) bannerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [createCase.created, createCase.error]);

  // Runs when the "Create case" button is pressed.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser from reloading the page
    createCase.submit(staffId);
  };

  return (
    // noValidate: we show our own error messages instead of the browser's pop-ups.
    <form className="ui-page case-page" onSubmit={handleSubmit} noValidate>
      <h1 className="ui-page-title">Create Case</h1>

      {/* Success and error messages from the last save */}
      <div ref={bannerRef} className="case-banners" aria-live="polite">
        {createCase.created && (
          <p className="form-message success">
            Case #{createCase.created.case_id} created
            {createCase.created.patient &&
              ` for ${createCase.created.patient.first_name} ${createCase.created.patient.last_name}`}
            .
          </p>
        )}
        {createCase.error && <p className="form-message error">{createCase.error}</p>}
      </div>

      <div className="case-steps">
        <CaseStep number={1} title="Patient">
          <CasePatientSelector
            patients={createCase.patients}
            loading={createCase.patientsLoading}
            error={createCase.fieldErrors.patient}
            loadError={createCase.patientsError}
            patientMode={createCase.patientMode}
            selectedPatientId={createCase.selectedPatientId}
            loadingPatient={createCase.loadingPatient}
            onSelectExisting={createCase.selectExistingPatient}
            onStartExisting={createCase.startExistingPatient}
            onSelectNew={createCase.selectNewPatient}
          />
        </CaseStep>

        <CaseStep number={2} title="Patient demographics">
          <PatientDemographics
            values={createCase.demographics}
            onChange={createCase.updateDemographics}
            errors={createCase.fieldErrors}
            readOnly={existing}
          />
        </CaseStep>

        <CaseStep number={3} title="Case content">
          <CaseContent
            values={createCase.caseContent}
            onChange={createCase.updateCaseContent}
            errors={createCase.fieldErrors}
          />
        </CaseStep>

        <CaseStep number={4} title="Chart data">
          <ChartData
            values={createCase.chartData}
            drugs={drugs}
            onChange={createCase.setChartData}
            errors={createCase.fieldErrors}
            readOnly={existing}
          />
        </CaseStep>

        <CaseStep number={5} title="Grading rubric">
          <RubricEditor rows={createCase.rubric} onChange={createCase.setRubric} error={createCase.fieldErrors.rubric} />
        </CaseStep>

        <CaseStep number={6} title="Assignment">
          <AssignmentSection values={createCase.assignment} onChange={createCase.updateAssignment} />
        </CaseStep>
      </div>

      <div className="case-actions">
        <button type="submit" className="ui-button case-submit" disabled={createCase.submitting}>
          {createCase.submitting ? "Creating…" : "Create case"}
        </button>
      </div>
    </form>
  );
}
