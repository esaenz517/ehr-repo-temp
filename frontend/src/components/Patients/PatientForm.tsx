import { FormEvent, useState } from "react";
import type { CreatePatientInput } from "../../api/patients";
import type { Drug, Provider } from "../../types";

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
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
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
    onSubmit({
      mrn: mrn || null,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender: gender || null,
      status,
      provider_id: providerId ? Number(providerId) : null,
      drug_ids: drugIds,
    });
    setMrn("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDateOfBirth("");
    setGender("");
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
