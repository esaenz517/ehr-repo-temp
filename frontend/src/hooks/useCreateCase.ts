import { useState } from "react";
import { casesApi } from "../api/cases";
import { patientsApi } from "../api/patients";
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
  const [chartData, setChartData] = useState<ChartDataValues>(EMPTY_CHART_DATA);
  // TODO (Assignment): add course / due date / mode / students state here.

  const [fieldErrors, setFieldErrors] = useState<CaseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false); // true while saving
  const [error, setError] = useState<string | null>(null); // error from the backend
  const [created, setCreated] = useState<Case | null>(null); // the case we just saved

  // Update one field in a section, keeping the other fields as they are.
  const updateDemographics = (field: keyof DemographicsValues, value: string) =>
    setDemographics((prev) => ({ ...prev, [field]: value }));

  const updateCaseContent = (field: keyof CaseContentValues, value: string) =>
    setCaseContent((prev) => ({ ...prev, [field]: value }));

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
    setChartData(EMPTY_CHART_DATA);
    setFieldErrors({});
  };

  // Save the case. This takes two requests for now:
  //   1. create the patient,
  //   2. create the case that points to that patient.
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
    chartData,
    setChartData,
    fieldErrors,
    submitting,
    error,
    created,
    updateDemographics,
    updateCaseContent,
    submit,
  };
}
