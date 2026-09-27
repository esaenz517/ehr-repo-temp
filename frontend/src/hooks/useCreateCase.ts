import { useState } from "react";
import { casesApi } from "../api/cases";
import { patientsApi } from "../api/patients";
import { CaseContentValues, EMPTY_CASE_CONTENT } from "../components/Cases/CaseContent";
import { DemographicsValues, EMPTY_DEMOGRAPHICS } from "../components/Patients/PatientDemographics";
import type { Case } from "../types";

// One error message per form field, keyed by the field's name.
export type CaseFieldErrors = Partial<Record<keyof DemographicsValues | keyof CaseContentValues, string>>;


// Dev notes:
// All the state + actions CreateCasePage needs.
// Each form section gets its own piece of state here. When a teammate builds a new section (Chart Data, Assignment, ...),

export function useCreateCase() {
  const [demographics, setDemographics] = useState<DemographicsValues>(EMPTY_DEMOGRAPHICS);
  const [caseContent, setCaseContent] = useState<CaseContentValues>(EMPTY_CASE_CONTENT);
  // TODO (Chart Data): add medications / allergies / labs state here.
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
    return errors;
  };

  // Clear the form so the instructor can create another case.
  const reset = () => {
    setDemographics(EMPTY_DEMOGRAPHICS);
    setCaseContent(EMPTY_CASE_CONTENT);
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
        drug_ids: [],
      });

      // Step 2: create the case for the new patient.
      const newCase = await casesApi.create({
        patient_id: patient.patient_id,
        chief_complaint: caseContent.chiefComplaint.trim(),
        narrative: caseContent.narrative.trim() || null,
        created_by_staff_id: staffId,
      });

      // TODO (Chart Data / Assignment): save those sections here, using newCase.case_id.

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
    fieldErrors,
    submitting,
    error,
    created,
    updateDemographics,
    updateCaseContent,
    submit,
  };
}
