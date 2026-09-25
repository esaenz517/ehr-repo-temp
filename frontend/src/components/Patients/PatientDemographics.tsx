import { useState } from "react";

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

export function PatientDemographics() {
  const [values, setValues] = useState(EMPTY);
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <input value={values.firstName} onChange={set("firstName")} placeholder="First Name" style={{ flex: 1 }} />
      <input value={values.lastName} onChange={set("lastName")} placeholder="Last Name" style={{ flex: 1 }} />
      <input value={values.preferredName} onChange={set("preferredName")} placeholder="Preferred Name" style={{ flex: 1 }} />
      <input type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} style={{ flex: 1 }} />

      <select value={values.sex} onChange={set("sex")} style={{ flex: 1 }}>
        <option value="">Sex assigned at birth</option>
        <option>Female</option>
        <option>Male</option>
        <option>Intersex</option>
      </select>
      <select value={values.genderIdentity} onChange={set("genderIdentity")} style={{ flex: 1 }}>
        <option value="">Gender identity</option>
        <option>Woman</option>
        <option>Man</option>
        <option>Nonbinary</option>
        <option>Transgender woman</option>
        <option>Transgender man</option>
        <option>Prefer not to say</option>
      </select>
      <select value={values.pronouns} onChange={set("pronouns")} style={{ flex: 1 }}>
        <option value="">Pronouns</option>
        <option>she/her</option>
        <option>he/him</option>
        <option>they/them</option>
        <option>Use name only</option>
      </select>
    </div>
  );
}
