import { FormEvent, useState } from "react";
import type { CreatePatientInput } from "../../api/patients";
import type { Drug, Provider } from "../../types";
import { GENDER_IDENTITY_OPTIONS, PRONOUN_OPTIONS, SEX_OPTIONS } from "./PatientDemographics";
import "./patients.css";

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

  // Drugs are picked from a dropdown one at a time and shown as removable chips.
  // The dropdown only lists drugs that haven't been picked yet.
  const selectedDrugs = drugs.filter((d) => drugIds.includes(d.drug_id));
  const remainingDrugs = drugs.filter((d) => !drugIds.includes(d.drug_id));

  const addDrug = (drugId: number) => setDrugIds((prev) => [...prev, drugId]);
  const removeDrug = (drugId: number) => setDrugIds((prev) => prev.filter((id) => id !== drugId));

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
    <form onSubmit={handleSubmit} className="patients-form">
      <h2 className="patients-form-title">New patient</h2>

      <div className="patients-form-grid">
        <div className="patients-field">
          <label htmlFor="patient-mrn" className="patients-label">MRN</label>
          <input
            id="patient-mrn"
            value={mrn}
            onChange={(e) => setMrn(e.target.value)}
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor="patient-first-name" className="patients-label">
            First name<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <input
            id="patient-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor="patient-middle-name" className="patients-label">Middle name</label>
          <input
            id="patient-middle-name"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor="patient-last-name" className="patients-label">
            Last name<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <input
            id="patient-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor="patient-preferred-name" className="patients-label">Preferred name</label>
          <input
            id="patient-preferred-name"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor="patient-dob" className="patients-label">
            Date of birth<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <input
            id="patient-dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor="patient-sex" className="patients-label">
            Sex at birth<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <select
            id="patient-sex"
            value={genderAtBirth}
            onChange={(e) => setGenderAtBirth(e.target.value)}
            required
            className="patients-input"
          >
            <option value="">Select…</option>
            {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="patients-field">
          <label htmlFor="patient-gender" className="patients-label">
            Gender identity<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <select
            id="patient-gender"
            value={genderIdentity}
            onChange={(e) => setGenderIdentity(e.target.value)}
            required
            className="patients-input"
          >
            <option value="">Select…</option>
            {GENDER_IDENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="patients-field">
          <label htmlFor="patient-pronouns" className="patients-label">
            Pronouns<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <select
            id="patient-pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            required
            className="patients-input"
          >
            <option value="">Select…</option>
            {PRONOUN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="patients-field">
          <label htmlFor="patient-status" className="patients-label">Status</label>
          <select
            id="patient-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="patients-input"
          >
            <option value="outpatient">Outpatient</option>
            <option value="inpatient">Inpatient</option>
          </select>
        </div>

        <div className="patients-field">
          <label htmlFor="patient-provider" className="patients-label">Provider</label>
          <select
            id="patient-provider"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="patients-input"
          >
            <option value="">No provider</option>
            {providers.map((provider) => (
              <option key={provider.provider_id} value={provider.provider_id}>
                Dr. {provider.first_name} {provider.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="patients-field patients-field--full">
          <label htmlFor="patient-drugs" className="patients-label">Drugs</label>
          <div className="patients-drugs">
            {/* Always shows the placeholder; picking an option adds it as a chip */}
            <select
              id="patient-drugs"
              value=""
              onChange={(e) => e.target.value && addDrug(Number(e.target.value))}
              disabled={remainingDrugs.length === 0}
              className="patients-input"
            >
              <option value="">
                {drugs.length === 0
                  ? "No drugs available"
                  : remainingDrugs.length === 0
                    ? "All drugs added"
                    : "Add a drug…"}
              </option>
              {remainingDrugs.map((drug) => (
                <option key={drug.drug_id} value={drug.drug_id}>{drug.name}</option>
              ))}
            </select>

            {selectedDrugs.map((drug) => (
              <span key={drug.drug_id} className="patients-drug-chip">
                {drug.name}
                <button
                  type="button"
                  className="patients-drug-chip-remove"
                  onClick={() => removeDrug(drug.drug_id)}
                  aria-label={`Remove ${drug.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="patients-form-actions">
        <button type="submit" className="ui-button">Add patient</button>
      </div>
    </form>
  );
}
