import { ReactNode, useState } from "react";

// Patient demographics section of the Create Case page. Frontend-only for now:
// values live in local state and aren't sent anywhere yet.
const EMPTY = {
  firstName: "",
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
      <Field id="demo-last" label="Last name" required>
        <input id="demo-last" value={values.lastName} onChange={set("lastName")} required />
      </Field>
      <Field id="demo-preferred" label="Preferred name">
        <input id="demo-preferred" value={values.preferredName} onChange={set("preferredName")} />
      </Field>

      <Field id="demo-dob" label="Date of birth" required>
        <input id="demo-dob" type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} required />
      </Field>
      <Field id="demo-sex" label="Sex assigned at birth">
        <select id="demo-sex" value={values.sex} onChange={set("sex")}>
          <option value="">Select</option>
          <option>Female</option>
          <option>Male</option>
          <option>Intersex</option>
        </select>
      </Field>
      <Field id="demo-gender" label="Gender identity">
        <select id="demo-gender" value={values.genderIdentity} onChange={set("genderIdentity")}>
          <option value="">Select</option>
          <option>Woman</option>
          <option>Man</option>
          <option>Nonbinary</option>
          <option>Transgender woman</option>
          <option>Transgender man</option>
          <option>Prefer not to say</option>
        </select>
      </Field>

      <Field id="demo-pronouns" label="Pronouns">
        <select id="demo-pronouns" value={values.pronouns} onChange={set("pronouns")}>
          <option value="">Select</option>
          <option>she/her</option>
          <option>he/him</option>
          <option>they/them</option>
          <option>Use name only</option>
        </select>
      </Field>
    </div>
  );
}
