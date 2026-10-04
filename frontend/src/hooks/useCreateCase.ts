import { useState } from "react";
import { assignmentApi } from "../api/assignment";
import { casesApi } from "../api/cases";
import { patientsApi } from "../api/patients";
import { AssignmentValues, EMPTY_ASSIGNMENT } from "../components/Assignment/AssignmentSection";
import { CaseContentValues, EMPTY_CASE_CONTENT } from "../components/Cases/CaseContent";
import { ChartDataValues, EMPTY_CHART_DATA } from "../components/Cases/ChartData";
import { DemographicsValues, EMPTY_DEMOGRAPHICS } from "../components/Patients/PatientDemographics";
import type { Case } from "../types";
import { usePatients } from "./usePatients";

export type PatientMode = "existing" | "new";

// One error message per form field, keyed by the field's name.
// "patient" is used by the Start Form patient selector.
export type CaseFieldErrors = Partial<
  Record<keyof DemographicsValues | keyof CaseContentValues | keyof ChartDataValues | "patient", string>
>;


// Dev notes:
// All the state + actions CreateCasePage needs.
// Each form section gets its own piece of state here. When a teammate builds a new section (Chart Data, Assignment, ...),

export function useCreateCase() {
  const [patientMode, setPatientMode] = useState<PatientMode>("new");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const [demographics, setDemographics] = useState<DemographicsValues>(EMPTY_DEMOGRAPHICS);
  const [caseContent, setCaseContent] = useState<CaseContentValues>(EMPTY_CASE_CONTENT);
  // TODO (Chart Data): add medications / allergies / labs state here.
  const [assignment, setAssignment] = useState<AssignmentValues>(EMPTY_ASSIGNMENT);
  const [chartData, setChartData] = useState<ChartDataValues>(EMPTY_CHART_DATA);

  const [fieldErrors, setFieldErrors] = useState<CaseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false); // true while saving
  const [error, setError] = useState<string | null>(null); // error from the backend
  const [created, setCreated] = useState<Case | null>(null); // the case we just saved

  // Existing patients used by the Start Form selector.
  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    reload: reloadPatients,
  } = usePatients();

  // Update one field in a section, keeping the other fields as they are.
  const updateDemographics = (field: keyof DemographicsValues, value: string) =>
    setDemographics((prev) => ({ ...prev, [field]: value }));

  const updateCaseContent = (field: keyof CaseContentValues, value: string) =>
    setCaseContent((prev) => ({ ...prev, [field]: value }));

  const updateAssignment = <K extends keyof AssignmentValues>(field: K, value: AssignmentValues[K]) =>
    setAssignment((prev) => ({ ...prev, [field]: value }));

  // Fill the form with an existing patient's demographic and chart information.
  // Case-specific information stays blank because this is a new case.
  const selectExistingPatient = async (patientId: number) => {
    setPatientMode("existing");
    setSelectedPatientId(patientId);
    setLoadingPatient(true);
    setError(null);
    setFieldErrors({});

    try {
      const [patient, context] = await Promise.all([
        patientsApi.get(patientId),
        patientsApi.chartContext(patientId),
      ]);

      setDemographics({
        firstName: patient.first_name,
        middleName: patient.middle_name || "",
        lastName: patient.last_name,
        preferredName: patient.preferred_name || "",
        dateOfBirth: patient.date_of_birth,
        sex: patient.gender_at_birth || "",
        genderIdentity: patient.gender_identity,
        pronouns: patient.pronouns,
      });

      setChartData({
        medications: context.medications.map((medication) => ({
          drugId: String(medication.drug_id),
          dose: medication.dosage || "",
          route: medication.route || "",
          frequency: medication.frequency || "",
        })),

        allergies: context.allergies.map((allergy) => ({
          substance: allergy.substance,
          reaction: allergy.reaction || "",
        })),

        labs: context.recent_labs.map((lab) => ({
          testName: lab.test_name,
          result: lab.result,
          unit: lab.unit || "",
          flag: lab.flag || "",
          collectedAt: lab.collected_at
            ? lab.collected_at.slice(0, 16)
            : "",
        })),
      });

      // Chief complaint and narrative belong to the new case,
      // not to the selected patient's existing chart.
      setCaseContent(EMPTY_CASE_CONTENT);
    } catch (err) {
      setSelectedPatientId(null);
      setDemographics(EMPTY_DEMOGRAPHICS);
      setChartData(EMPTY_CHART_DATA);

      setError(
        err instanceof Error
          ? `Failed to load patient: ${err.message}`
          : "Failed to load patient"
      );
    } finally {
      setLoadingPatient(false);
    }
  };

  // Switch the form back to creating a brand-new patient.
  const selectNewPatient = () => {
    setPatientMode("new");
    setSelectedPatientId(null);
    setDemographics(EMPTY_DEMOGRAPHICS);
    setCaseContent(EMPTY_CASE_CONTENT);
    setChartData(EMPTY_CHART_DATA);
    setFieldErrors({});
    setError(null);
  };

  // Check the required fields for a case (Ex. First name, notes, drug data, etc.)
  const validate = (): CaseFieldErrors => {
    const errors: CaseFieldErrors = {};

    // Existing patients only need a valid selection.
    // Their demographics and chart data came from the database.
    if (patientMode === "existing") {
      if (selectedPatientId === null) {
        errors.patient = "Select an existing patient.";
      }
    }

    // New patients need their demographic and chart information validated
    // because those values are about to be added to the database.
    if (patientMode === "new") {
      if (!demographics.firstName.trim()) errors.firstName = "Enter a first name.";
      if (!demographics.lastName.trim()) errors.lastName = "Enter a last name.";
      if (!demographics.dateOfBirth) errors.dateOfBirth = "Enter a date of birth.";
      if (!demographics.sex) errors.sex = "Select sex assigned at birth.";
      if (!demographics.genderIdentity) errors.genderIdentity = "Select a gender identity.";
      if (!demographics.pronouns) errors.pronouns = "Select pronouns.";

      // Each medication needs a drug, and a drug can only be listed once per patient.
      const drugIds = chartData.medications.map((m) => m.drugId);

      if (drugIds.some((id) => !id)) {
        errors.medications = "Every medication needs a drug.";
      } else if (new Set(drugIds).size !== drugIds.length) {
        errors.medications = "Each drug can only be listed once.";
      }

      // Substance, test, result, and collection time can't be empty in the database.
      if (chartData.allergies.some((a) => !a.substance.trim())) {
        errors.allergies = "Every allergy needs a substance.";
      }

      if (
        chartData.labs.some(
          (l) => !l.testName.trim() || !l.result.trim() || !l.collectedAt
        )
      ) {
        errors.labs = "Every lab needs a test, result, and collection time.";
      }
    }

    // Case content is required whether the patient is new or existing.
    if (!caseContent.chiefComplaint.trim()) {
      errors.chiefComplaint = "Enter a chief complaint.";
    }

    return errors;
  };

  // Clear the form so the instructor can create another case.
  const reset = () => {
    setPatientMode("new");
    setSelectedPatientId(null);
    setDemographics(EMPTY_DEMOGRAPHICS);
    setCaseContent(EMPTY_CASE_CONTENT);
    setAssignment(EMPTY_ASSIGNMENT);
    setChartData(EMPTY_CHART_DATA);
    setFieldErrors({});
  };

  // Save the case.
  //
  // New patient:
  //   1. create the patient,
  //   2. create the case,
  //   3. save chart data with the case request,
  //   4. assign the case if students are checked.
  //
  // Existing patient:
  //   1. reuse the selected patient id,
  //   2. create the case,
  //   3. do NOT re-save chart data,
  //   4. assign the case if students are checked.
  //
  // staffId is the logged-in instructor, SAVED as the case's creator.
  const submit = async (staffId: number) => {
    setCreated(null);
    setError(null);

    if (loadingPatient) {
      setError("Wait for the selected patient's information to finish loading.");
      return;
    }

    // Stop here if any required field is empty.
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      let patientId: number;

      // Step 1: create a new patient only when the instructor selected
      // "Create new patient".
      if (patientMode === "new") {
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

          // Medications are saved with the case below so dose,
          // route, and frequency can also be stored.
          drug_ids: [],
        });

        patientId = patient.patient_id;

        // Refresh the selector so the new patient will immediately be
        // available if another case is created for them.
        await reloadPatients();
      } else {
        // Existing patient: use the patient already in the database.
        patientId = selectedPatientId as number;
      }

      // Step 2: create the case for either the new or existing patient.
      const newCase = await casesApi.create({
        patient_id: patientId,
        chief_complaint: caseContent.chiefComplaint.trim(),
        narrative: caseContent.narrative.trim() || null,
        created_by_staff_id: staffId,

        // The current backend saves these rows into patient chart tables.
        // Only send them for a NEW patient. Existing patient chart rows
        // already exist and should not be duplicated.
        medications:
          patientMode === "new"
            ? chartData.medications.map((m) => ({
              drug_id: Number(m.drugId),
              dose: m.dose.trim() || null,
              route: m.route || null,
              frequency: m.frequency || null,
            }))
            : [],

        allergies:
          patientMode === "new"
            ? chartData.allergies.map((a) => ({
              substance: a.substance.trim(),
              reaction: a.reaction.trim() || null,
            }))
            : [],

        labs:
          patientMode === "new"
            ? chartData.labs.map((l) => ({
              test_name: l.testName.trim(),
              result: l.result.trim(),
              unit: l.unit.trim() || null,
              flag: l.flag.trim() || null,
              collected_at: l.collectedAt,
            }))
            : [],
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
    patientMode,
    selectedPatientId,
    loadingPatient,
    patients,
    patientsLoading,
    patientsError,
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
    selectExistingPatient,
    selectNewPatient,
    submit,
  };
}
