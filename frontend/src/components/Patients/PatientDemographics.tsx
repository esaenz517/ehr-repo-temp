import { Field } from "../FormField";
import "../Cases/cases.css";

// Dropdown options for the patient identity fields. Shared with PatientForm so
// both forms send the same values to the backend.
export const SEX_OPTIONS = ["Female", "Male", "Intersex"];
export const GENDER_IDENTITY_OPTIONS = ["Woman", "Man", "Nonbinary", "Transgender woman", "Transgender man", "Prefer not to say"];
export const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them", "Use name only"];

// The values this section collects. The state itself lives in useCreateCase.
export interface DemographicsValues {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  sex: string;
  genderIdentity: string;
  pronouns: string;
}

// Starting (blank) values for the form.
export const EMPTY_DEMOGRAPHICS: DemographicsValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  sex: "",
  genderIdentity: "",
  pronouns: "",
};

// Whole years since a "YYYY-MM-DD" date of birth, or null if it isn't a date.
function ageFrom(dateOfBirth: string): number | null {
  const [y, m, d] = dateOfBirth.split("-").map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  const hadBirthday = today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  return today.getFullYear() - y - (hadBirthday ? 0 : 1);
}

interface PatientDemographicsProps {
  values: DemographicsValues;
  onChange: (field: keyof DemographicsValues, value: string) => void;
  errors: Partial<Record<keyof DemographicsValues, string>>;
  readOnly?: boolean;
}

// Patient demographics section of the Create Case page.
// It only displays the values it's given and reports changes back up.
export function PatientDemographics({ values, onChange, errors, readOnly = false }: PatientDemographicsProps) {
  // Returns an onChange handler that updates one field.
  const set = (field: keyof DemographicsValues) => (e: { target: { value: string } }) =>
    onChange(field, e.target.value);

  // Existing patient: show their details as a card instead of disabled inputs.
  if (readOnly) {
    if (!values.firstName) {
      return <p className="case-empty">Choose a patient above to load their demographics.</p>;
    }
    const fullName = [values.firstName, values.middleName, values.lastName].filter(Boolean).join(" ");
    const age = ageFrom(values.dateOfBirth);
    return (
      <div className="case-patient">
        <div className="case-patient-info">
          <p className="case-patient-name">
            {fullName}
            {values.preferredName && <span className="ui-muted"> “{values.preferredName}”</span>}
          </p>
          <dl className="ui-detail-list case-patient-details">
            <dt>Date of birth</dt>
            <dd>{values.dateOfBirth}{age !== null && ` (${age} y)`}</dd>
            <dt>Sex at birth</dt>
            <dd>{values.sex || "—"}</dd>
            <dt>Gender identity</dt>
            <dd>{values.genderIdentity || "—"}</dd>
            <dt>Pronouns</dt>
            <dd>{values.pronouns || "—"}</dd>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="form-grid">
      <Field id="demo-first" label="First name" required error={errors.firstName}>
        <input id="demo-first" value={values.firstName} onChange={set("firstName")} required />
      </Field>
      <Field id="demo-middle" label="Middle name">
        <input id="demo-middle" value={values.middleName} onChange={set("middleName")} />
      </Field>
      <Field id="demo-last" label="Last name" required error={errors.lastName}>
        <input id="demo-last" value={values.lastName} onChange={set("lastName")} required />
      </Field>

      <Field id="demo-preferred" label="Preferred name">
        <input id="demo-preferred" value={values.preferredName} onChange={set("preferredName")} />
      </Field>
      <Field id="demo-dob" label="Date of birth" required error={errors.dateOfBirth}>
        <input id="demo-dob" type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} required />
      </Field>
      <Field id="demo-sex" label="Sex assigned at birth" required error={errors.sex}>
        <select id="demo-sex" value={values.sex} onChange={set("sex")} required>
          <option value="">Select</option>
          {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>

      <Field id="demo-gender" label="Gender identity" required error={errors.genderIdentity}>
        <select id="demo-gender" value={values.genderIdentity} onChange={set("genderIdentity")} required>
          <option value="">Select</option>
          {GENDER_IDENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field id="demo-pronouns" label="Pronouns" required error={errors.pronouns}>
        <select id="demo-pronouns" value={values.pronouns} onChange={set("pronouns")} required>
          <option value="">Select</option>
          {PRONOUN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
    </div>
  );
}
