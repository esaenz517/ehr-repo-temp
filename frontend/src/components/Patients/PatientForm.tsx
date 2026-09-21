import { FormEvent, useState } from "react";
import type { CreatePatientInput } from "../../api/patients";

interface PatientFormProps {
  onSubmit: (input: CreatePatientInput) => void;
}

export function PatientForm({ onSubmit }: PatientFormProps) {
  const [mrn, setMrn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("outpatient");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) return;
    onSubmit({
      mrn: mrn || null,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender: gender || null,
      status,
    });
    setMrn("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDateOfBirth("");
    setGender("");
    setStatus("outpatient");
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      <input
        value={mrn}
        onChange={(e) => setMrn(e.target.value)}
        placeholder="MRN"
        style={{ flex: 1 }}
      />
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
        style={{ flex: 2 }}
      />
      <input
        value={middleName}
        onChange={(e) => setMiddleName(e.target.value)}
        placeholder="Middle Name"
        style={{ flex: 2 }}
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
        style={{ flex: 2 }}
      />
      <input
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        style={{ flex: 2 }}
      />
      <input
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        placeholder="Gender"
        style={{ flex: 2 }}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: 2 }}>
        <option value="outpatient">Outpatient</option>
        <option value="inpatient">Inpatient</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}
