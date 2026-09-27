import { ReactNode, useState } from "react";

// Dropdown options for the patient identity fields. Shared with PatientForm so
// both forms send the same values to the backend.
export const SEX_OPTIONS = ["Female", "Male", "Intersex"];
export const GENDER_IDENTITY_OPTIONS = ["Woman", "Man", "Nonbinary", "Transgender woman", "Transgender man", "Prefer not to say"];
export const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them", "Use name only"];

// Patient demographics section of the Create Case page. Frontend-only for now:
// values live in local state and aren't sent anywhere yet.
const EMPTY = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  sex: "",
  genderIdentity: "",
  pronouns: "",
};

type FieldName = keyof typeof EMPTY;

// Label stacked above its input, one cell of the .form-grid table.
function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

export function PatientDemographics() {
  const [values, setValues] = useState(EMPTY);
  const set = (field: FieldName) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="form-grid">
      <Field id="demo-first" label="First name" required>
        <input id="demo-first" value={values.firstName} onChange={set("firstName")} required />
      </Field>
      <Field id="demo-middle" label="Middle name">
        <input id="demo-middle" value={values.middleName} onChange={set("middleName")} />
      </Field>
      <Field id="demo-last" label="Last name" required>
        <input id="demo-last" value={values.lastName} onChange={set("lastName")} required />
      </Field>

      <Field id="demo-preferred" label="Preferred name">
        <input id="demo-preferred" value={values.preferredName} onChange={set("preferredName")} />
      </Field>
      <Field id="demo-dob" label="Date of birth" required>
        <input id="demo-dob" type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} required />
      </Field>
      <Field id="demo-sex" label="Sex assigned at birth" required>
        <select id="demo-sex" value={values.sex} onChange={set("sex")} required>
          <option value="">Select</option>
          {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>

      <Field id="demo-gender" label="Gender identity" required>
        <select id="demo-gender" value={values.genderIdentity} onChange={set("genderIdentity")} required>
          <option value="">Select</option>
          {GENDER_IDENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field id="demo-pronouns" label="Pronouns" required>
        <select id="demo-pronouns" value={values.pronouns} onChange={set("pronouns")} required>
          <option value="">Select</option>
          {PRONOUN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
    </div>
  );
}
