import { FormEvent, useState } from "react";
import type { CreatePatientInput } from "../../api/patients";
import type { Patient, Provider } from "../../types";
import { MedicationAutocomplete } from "../Medications/MedicationAutocomplete";
import { GENDER_IDENTITY_OPTIONS, PRONOUN_OPTIONS, SEX_OPTIONS } from "./PatientDemographics";
import "./patients.css";

interface PatientFormProps {
  providers: Provider[];
  onSubmit: (input: CreatePatientInput) => void; // edit mode: the parent closes the form once saved
  patient?: Patient; // when set, the form edits this patient instead of adding a new one
  onCancel?: () => void; // edit mode: shows a Cancel button
}

// Adds a new patient, or (with `patient`) edits an existing one using the same fields.
export function PatientForm({ providers, onSubmit, patient, onCancel }: PatientFormProps) {
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
  const [drugNames, setDrugNames] = useState<string[]>(patient?.drugs.map((d) => d.name) ?? []);
  const [drugQuery, setDrugQuery] = useState(""); // what's typed in the medication box

  // Type any medication; picking a suggestion (or pressing Enter) adds it as a removable chip.
  const addDrug = (name: string) => {
    const clean = name.trim();
    setDrugQuery("");
    if (!clean) return;
    setDrugNames((prev) => (prev.some((n) => n.toLowerCase() === clean.toLowerCase()) ? prev : [...prev, clean]));
  };
  const removeDrug = (name: string) => setDrugNames((prev) => prev.filter((n) => n !== name));

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
      drug_ids: [],
      drug_names: drugNames,
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
    setDrugNames([]);
    setDrugQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={editing ? "patients-form patients-form--edit" : "ui-panel ui-panel--overflow patients-form"}
    >
      <header className={editing ? "patients-form-header" : "ui-panel-header"}>
        <div className="ui-panel-heading">
          <h2 className="ui-panel-title">{editing ? "Edit patient" : "New patient"}</h2>
          {!editing && <p className="ui-panel-description">Fields marked * are required.</p>}
        </div>
      </header>

      <div className={editing ? undefined : "ui-panel-body"}>
      <div className="form-grid form-grid--4">
        <div className="form-field">
          <label htmlFor={`${idPrefix}-mrn`}>MRN</label>
          <input
            id={`${idPrefix}-mrn`}
            value={mrn}
            onChange={(e) => setMrn(e.target.value)}
            className="ui-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-first-name`}>
            First name<span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-first-name`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="ui-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-middle-name`}>Middle name</label>
          <input
            id={`${idPrefix}-middle-name`}
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="ui-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-last-name`}>
            Last name<span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-last-name`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="ui-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-preferred-name`}>Preferred name</label>
          <input
            id={`${idPrefix}-preferred-name`}
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className="ui-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-dob`}>
            Date of birth<span className="required" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-dob`}
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="ui-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-sex`}>
            Sex at birth<span className="required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-sex`}
            value={genderAtBirth}
            onChange={(e) => setGenderAtBirth(e.target.value)}
            required
            className="ui-input"
          >
            <option value="">Select…</option>
            {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-gender`}>
            Gender identity<span className="required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-gender`}
            value={genderIdentity}
            onChange={(e) => setGenderIdentity(e.target.value)}
            required
            className="ui-input"
          >
            <option value="">Select…</option>
            {GENDER_IDENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-pronouns`}>
            Pronouns<span className="required" aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-pronouns`}
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            required
            className="ui-input"
          >
            <option value="">Select…</option>
            {PRONOUN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-status`}>Status</label>
          <select
            id={`${idPrefix}-status`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="ui-input"
          >
            <option value="outpatient">Outpatient</option>
            <option value="inpatient">Inpatient</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-provider`}>Provider</label>
          <select
            id={`${idPrefix}-provider`}
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
        </div>

        <div className="form-field form-field--full">
          <label htmlFor={`${idPrefix}-drugs`}>Drugs</label>
          <div className="patients-drugs">
            {/* Type any medication; the most likely match autofills. Enter or a click adds it as a chip. */}
            <MedicationAutocomplete
              id={`${idPrefix}-drugs`}
              className="ui-input"
              placeholder="Add a drug…"
              value={drugQuery}
              onChange={setDrugQuery}
              onSelect={addDrug}
              onEnterTyped={addDrug}
            />

            {drugNames.map((name) => (
              <span key={name} className="patients-drug-chip">
                {name}
                <button
                  type="button"
                  className="patients-drug-chip-remove"
                  onClick={() => removeDrug(name)}
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      </div>

      <div className={editing ? "ui-form-actions patients-form-actions" : "ui-panel-footer"}>
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
