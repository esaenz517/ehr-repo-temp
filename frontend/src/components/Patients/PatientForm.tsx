import { FormEvent, useState } from "react";
import type { CreatePatientInput } from "../../api/patients";
import type { Drug, Provider } from "../../types";
import { GENDER_IDENTITY_OPTIONS, PRONOUN_OPTIONS, SEX_OPTIONS } from "./PatientDemographics";

interface PatientFormProps {
  providers: Provider[];
  drugs: Drug[];
  onSubmit: (input: CreatePatientInput) => void;
}

export function PatientForm({ providers, drugs, onSubmit }: PatientFormProps) {
  const [mrn, setMrn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [genderAtBirth, setGenderAtBirth] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [status, setStatus] = useState("outpatient");
  const [providerId, setProviderId] = useState("");
  const [drugIds, setDrugIds] = useState<number[]>([]);

  const toggleDrug = (drugId: number) => {
    setDrugIds((prev) =>
      prev.includes(drugId) ? prev.filter((id) => id !== drugId) : [...prev, drugId]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) return;
    if (!genderAtBirth || !genderIdentity || !pronouns) return;
    onSubmit({
      mrn: mrn || null,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      preferred_name: preferredName || null,
      date_of_birth: dateOfBirth,
      gender_at_birth: genderAtBirth,
      gender_identity: genderIdentity,
      pronouns,
      status,
      provider_id: providerId ? Number(providerId) : null,
      drug_ids: drugIds,
    });
    setMrn("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPreferredName("");
    setDateOfBirth("");
    setGenderAtBirth("");
    setGenderIdentity("");
    setPronouns("");
    setStatus("outpatient");
    setProviderId("");
    setDrugIds([]);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
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
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          placeholder="Preferred Name"
          style={{ flex: 2 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          style={{ flex: 2 }}
        />
        <select value={genderAtBirth} onChange={(e) => setGenderAtBirth(e.target.value)} style={{ flex: 2 }}>
          <option value="">Sex at birth</option>
          {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={genderIdentity} onChange={(e) => setGenderIdentity(e.target.value)} style={{ flex: 2 }}>
          <option value="">Gender identity</option>
          {GENDER_IDENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={pronouns} onChange={(e) => setPronouns(e.target.value)} style={{ flex: 2 }}>
          <option value="">Pronouns</option>
          {PRONOUN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: 2 }}>
          <option value="outpatient">Outpatient</option>
          <option value="inpatient">Inpatient</option>
        </select>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          style={{ flex: 2 }}
        >
          <option value="">No provider</option>
          {providers.map((provider) => (
            <option key={provider.provider_id} value={provider.provider_id}>
              Dr. {provider.first_name} {provider.last_name}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </div>

      {drugs.length > 0 && (
        <div style={{ fontSize: 14 }}>
          <span style={{ marginRight: 8, color: "#555" }}>Drugs:</span>
          {drugs.map((drug) => (
            <label key={drug.drug_id} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={drugIds.includes(drug.drug_id)}
                onChange={() => toggleDrug(drug.drug_id)}
              />{" "}
              {drug.name}
            </label>
          ))}
        </div>
      )}
    </form>
  );
}
