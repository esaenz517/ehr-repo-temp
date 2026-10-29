import { FormEvent, useState } from "react";
import type { CreatePatientInput } from "../../api/patients";
import type { Drug, Patient, Provider } from "../../types";
import { GENDER_IDENTITY_OPTIONS, PRONOUN_OPTIONS, SEX_OPTIONS } from "./PatientDemographics";
import "./patients.css";

interface PatientFormProps {
  providers: Provider[];
  drugs: Drug[];
  onSubmit: (input: CreatePatientInput) => void; // edit mode: the parent closes the form once saved
  patient?: Patient; // when set, the form edits this patient instead of adding a new one
  onCancel?: () => void; // edit mode: shows a Cancel button
}

// Adds a new patient, or (with `patient`) edits an existing one using the same fields.
export function PatientForm({ providers, drugs, onSubmit, patient, onCancel }: PatientFormProps) {
  const editing = patient !== undefined;
  // Field ids must be unique on the page, and an edit form can be open next to the new-patient form.
  const idPrefix = editing ? `patient-${patient.patient_id}` : "patient";

  const [mrn, setMrn] = useState(patient?.mrn ?? "");
  const [firstName, setFirstName] = useState(patient?.first_name ?? "");
  const [middleName, setMiddleName] = useState(patient?.middle_name ?? "");
  const [lastName, setLastName] = useState(patient?.last_name ?? "");
  const [preferredName, setPreferredName] = useState(patient?.preferred_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(patient?.date_of_birth ?? "");
  const [genderAtBirth, setGenderAtBirth] = useState(patient?.gender_at_birth ?? "");
  const [genderIdentity, setGenderIdentity] = useState(patient?.gender_identity ?? "");
  const [pronouns, setPronouns] = useState(patient?.pronouns ?? "");
  const [status, setStatus] = useState(patient?.status ?? "outpatient");
  const [providerId, setProviderId] = useState(patient?.provider_id?.toString() ?? "");
  const [drugIds, setDrugIds] = useState<number[]>(patient?.drugs.map((d) => d.drug_id) ?? []);

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
    if (editing) return; // keep the values; the parent closes the form once saved
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
    <form onSubmit={handleSubmit} className={editing ? "patients-form patients-form--edit" : "patients-form"}>
      <h2 className="patients-form-title">{editing ? "Edit patient" : "New patient"}</h2>

      <div className="patients-form-grid">
        <div className="patients-field">
          <label htmlFor={`${idPrefix}-mrn`} className="patients-label">MRN</label>
          <input
            id={`${idPrefix}-mrn`}
            value={mrn}
            onChange={(e) => setMrn(e.target.value)}
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-first-name`} className="patients-label">
            First name<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-first-name`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-middle-name`} className="patients-label">Middle name</label>
          <input
            id={`${idPrefix}-middle-name`}
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-last-name`} className="patients-label">
            Last name<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-last-name`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-preferred-name`} className="patients-label">Preferred name</label>
          <input
            id={`${idPrefix}-preferred-name`}
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-dob`} className="patients-label">
            Date of birth<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-dob`}
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="patients-input"
          />
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-sex`} className="patients-label">
            Sex at birth<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-sex`}
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
          <label htmlFor={`${idPrefix}-gender`} className="patients-label">
            Gender identity<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-gender`}
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
          <label htmlFor={`${idPrefix}-pronouns`} className="patients-label">
            Pronouns<span className="patients-required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-pronouns`}
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
          <label htmlFor={`${idPrefix}-status`} className="patients-label">Status</label>
          <select
            id={`${idPrefix}-status`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="patients-input"
          >
            <option value="outpatient">Outpatient</option>
            <option value="inpatient">Inpatient</option>
          </select>
        </div>

        <div className="patients-field">
          <label htmlFor={`${idPrefix}-provider`} className="patients-label">Provider</label>
          <select
            id={`${idPrefix}-provider`}
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
          <label htmlFor={`${idPrefix}-drugs`} className="patients-label">Drugs</label>
          <div className="patients-drugs">
            {/* Always shows the placeholder; picking an option adds it as a chip */}
            <select
              id={`${idPrefix}-drugs`}
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
        {onCancel && (
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-button">{editing ? "Save changes" : "Add patient"}</button>
      </div>
    </form>
  );
}
