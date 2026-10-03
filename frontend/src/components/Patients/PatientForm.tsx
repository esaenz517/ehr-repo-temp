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
    <form onSubmit={handleSubmit} className="ui-form-panel">
      <div className="ui-form-row">
        <input
          value={mrn}
          onChange={(e) => setMrn(e.target.value)}
          placeholder="MRN"
          className="ui-input"
        />
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="ui-input ui-input--wide"
        />
        <input
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          placeholder="Middle Name"
          className="ui-input ui-input--wide"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="ui-input ui-input--wide"
        />
        <input
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          placeholder="Preferred Name"
          className="ui-input ui-input--wide"
        />
      </div>

      <div className="ui-form-row">
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="ui-input"
        />
        <select value={genderAtBirth} onChange={(e) => setGenderAtBirth(e.target.value)} className="ui-input">
          <option value="">Sex at birth</option>
          {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={genderIdentity} onChange={(e) => setGenderIdentity(e.target.value)} className="ui-input">
          <option value="">Gender identity</option>
          {GENDER_IDENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={pronouns} onChange={(e) => setPronouns(e.target.value)} className="ui-input">
          <option value="">Pronouns</option>
          {PRONOUN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="ui-input">
          <option value="outpatient">Outpatient</option>
          <option value="inpatient">Inpatient</option>
        </select>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="ui-input"
        >
          <option value="">No provider</option>
          {providers.map((provider) => (
            <option key={provider.provider_id} value={provider.provider_id}>
              Dr. {provider.first_name} {provider.last_name}
            </option>
          ))}
        </select>
        <button type="submit" className="ui-button">Add</button>
      </div>

      {drugs.length > 0 && (
        <div className="ui-checkbox-group">
          <span className="ui-checkbox-group-label">Drugs:</span>
          {drugs.map((drug) => (
            <label key={drug.drug_id} className="ui-checkbox">
              <input
                type="checkbox"
                checked={drugIds.includes(drug.drug_id)}
                onChange={() => toggleDrug(drug.drug_id)}
              />
              {drug.name}
            </label>
          ))}
        </div>
      )}
    </form>
  );
}
