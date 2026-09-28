import { useState } from "react";
import { assignmentApi } from "../api/assignment";
import { casesApi } from "../api/cases";
import { patientsApi } from "../api/patients";
import { AssignmentValues, EMPTY_ASSIGNMENT } from "../components/Assignment/AssignmentSection";
import { CaseContentValues, EMPTY_CASE_CONTENT } from "../components/Cases/CaseContent";
import { ChartDataValues, EMPTY_CHART_DATA } from "../components/Cases/ChartData";
import { DemographicsValues, EMPTY_DEMOGRAPHICS } from "../components/Patients/PatientDemographics";
import type { Case } from "../types";

// One error message per form field, keyed by the field's name.
export type CaseFieldErrors = Partial<
  Record<keyof DemographicsValues | keyof CaseContentValues | keyof ChartDataValues, string>
>;


// Dev notes:
// All the state + actions CreateCasePage needs.
// Each form section gets its own piece of state here. When a teammate builds a new section (Chart Data, Assignment, ...),

export function useCreateCase() {
  const [demographics, setDemographics] = useState<DemographicsValues>(EMPTY_DEMOGRAPHICS);
  const [caseContent, setCaseContent] = useState<CaseContentValues>(EMPTY_CASE_CONTENT);
  // TODO (Chart Data): add medications / allergies / labs state here.
  const [assignment, setAssignment] = useState<AssignmentValues>(EMPTY_ASSIGNMENT);
  const [chartData, setChartData] = useState<ChartDataValues>(EMPTY_CHART_DATA);

  const [fieldErrors, setFieldErrors] = useState<CaseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false); // true while saving
  const [error, setError] = useState<string | null>(null); // error from the backend
  const [created, setCreated] = useState<Case | null>(null); // the case we just saved

  // Update one field in a section, keeping the other fields as they are.
  const updateDemographics = (field: keyof DemographicsValues, value: string) =>
    setDemographics((prev) => ({ ...prev, [field]: value }));

  const updateCaseContent = (field: keyof CaseContentValues, value: string) =>
    setCaseContent((prev) => ({ ...prev, [field]: value }));

  const updateAssignment = <K extends keyof AssignmentValues>(field: K, value: AssignmentValues[K]) =>
    setAssignment((prev) => ({ ...prev, [field]: value }));

  // Check the required fields for a case (Ex. First name, notes, drug data, etc.)
  const validate = (): CaseFieldErrors => {
    const errors: CaseFieldErrors = {};
    if (!demographics.firstName.trim()) errors.firstName = "Enter a first name.";
    if (!demographics.lastName.trim()) errors.lastName = "Enter a last name.";
    if (!demographics.dateOfBirth) errors.dateOfBirth = "Enter a date of birth.";
    if (!demographics.sex) errors.sex = "Select sex assigned at birth.";
    if (!demographics.genderIdentity) errors.genderIdentity = "Select a gender identity.";
    if (!demographics.pronouns) errors.pronouns = "Select pronouns.";
    if (!caseContent.chiefComplaint.trim()) errors.chiefComplaint = "Enter a chief complaint.";

    // Each medication needs a drug, and a drug can only be listed once per patient.
    const drugIds = chartData.medications.map((m) => m.drugId);
    if (drugIds.some((id) => !id)) errors.medications = "Every medication needs a drug.";
    else if (new Set(drugIds).size !== drugIds.length) errors.medications = "Each drug can only be listed once.";

    // Substance, test, result, and collection time can't be empty in the database.
    if (chartData.allergies.some((a) => !a.substance.trim()))
      errors.allergies = "Every allergy needs a substance.";
    if (chartData.labs.some((l) => !l.testName.trim() || !l.result.trim() || !l.collectedAt))
      errors.labs = "Every lab needs a test, result, and collection time.";
    
    return errors;
  };

  // Clear the form so the instructor can create another case.
  const reset = () => {
    setDemographics(EMPTY_DEMOGRAPHICS);
    setCaseContent(EMPTY_CASE_CONTENT);
    setAssignment(EMPTY_ASSIGNMENT);
    setChartData(EMPTY_CHART_DATA);
    setFieldErrors({});
  };

  // Save the case. This takes up to three requests:
  //   1. create the patient,
  //   2. create the case that points to that patient,
  //   3. assign the case to the checked students (skipped if none are checked).
  // staffId is the logged-in instructor, SAVED as the case's creator.
  const submit = async (staffId: number) => {
    setCreated(null);
    setError(null);

    // Stop here if any required field is empty.
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // Step 1: create the patient.
      const patient = await patientsApi.create({
        mrn: null,
        first_name: demographics.firstName.trim(),
        middle_name: demographics.middleName.trim() || null,
        last_name: demographics.lastName.trim(),
        preferred_name: demographics.preferredName.trim() || null,
        date_of_birth: demographics.dateOfBirth,
        gender_at_birth: demographics.sex,
        gender_identity: demographics.genderIdentity,
        pronouns: demographics.pronouns,
        status: "outpatient",
        provider_id: null,
        drug_ids: [], // medications are saved with the case below (with dose, route, frequency)
      });

      // Step 2: create the case for the new patient.
      const newCase = await casesApi.create({
        patient_id: patient.patient_id,
        chief_complaint: caseContent.chiefComplaint.trim(),
        narrative: caseContent.narrative.trim() || null,
        created_by_staff_id: staffId,
        // Convert the form rows to the backend's field names; blank optional fields become null.
        medications: chartData.medications.map((m) => ({
          drug_id: Number(m.drugId),
          dose: m.dose.trim() || null,
          route: m.route || null,
          frequency: m.frequency || null,
        })),
        allergies: chartData.allergies.map((a) => ({
          substance: a.substance.trim(),
          reaction: a.reaction.trim() || null,
        })),
        labs: chartData.labs.map((l) => ({
          test_name: l.testName.trim(),
          result: l.result.trim(),
          unit: l.unit.trim() || null,
          flag: l.flag.trim() || null,
          collected_at: l.collectedAt,
        })),
      });

      // TODO (Chart Data): save that section here, using newCase.case_id.

      // Step 3: assign the case. The case is already saved at this point, so if
      // this step fails, say so instead of reporting the whole case as failed.
      if (assignment.studentIds.length > 0) {
        try {
          await assignmentApi.create({
            case_id: newCase.case_id,
            course: assignment.course.trim() || null,
            // datetime-local gives local time; the backend stores UTC without a "Z".
            due_date: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 19) : null,
            assignment_type: assignment.assignmentType,
            assigned_to: assignment.studentIds,
            assigned_by: staffId, // TEMPORARY: the backend will take this from the session
          });
        } catch (err) {
          setCreated(newCase);
          reset();
          setError(
            `Case #${newCase.case_id} was created, but assigning it failed: ` +
              (err instanceof Error ? err.message : "unknown error")
          );
          return;
        }
      }
      // TODO (Assignment): save that section here, using newCase.case_id.

      setCreated(newCase);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    demographics,
    caseContent,
    assignment,
    chartData,
    setChartData,
    fieldErrors,
    submitting,
    error,
    created,
    updateDemographics,
    updateCaseContent,
    updateAssignment,
    submit,
  };
}
