import { FormEvent, useState } from "react";
import type { CreateProviderInput } from "../../api/providers";

interface ProviderFormProps {
  onSubmit: (input: CreateProviderInput) => void;
  onCancel?: () => void; // shows a Cancel button that closes the form
}

// Labeled text inputs for the provider form, in display order
const FIELDS = [
  { key: "firstName", label: "First name", required: true, type: "text" },
  { key: "lastName", label: "Last name", required: true, type: "text" },
  { key: "specialty", label: "Specialty", required: false, type: "text" },
  { key: "phone", label: "Phone", required: false, type: "tel" },
  { key: "email", label: "Email", required: false, type: "email" },
] as const;

export function ProviderForm({ onSubmit, onCancel }: ProviderFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    onSubmit({
      first_name: firstName,
      last_name: lastName,
      specialty: specialty || null,
      phone: phone || null,
      email: email || null,
    });
    setFirstName("");
    setLastName("");
    setSpecialty("");
    setPhone("");
    setEmail("");
  };

  const values = { firstName, lastName, specialty, phone, email };
  const setters = { firstName: setFirstName, lastName: setLastName, specialty: setSpecialty, phone: setPhone, email: setEmail };

  return (
    <form onSubmit={handleSubmit} className="ui-panel" aria-label="New provider">
      <header className="ui-panel-header">
        <div className="ui-panel-heading">
          <h2 className="ui-panel-title">New provider</h2>
          <p className="ui-panel-description">Fields marked * are required.</p>
        </div>
      </header>

      <div className="ui-panel-body">
        <div className="form-grid">
          {FIELDS.map((f) => (
            <div key={f.key} className="form-field">
              <label htmlFor={`provider-${f.key}`}>
                {f.label}
                {f.required && <span className="required" aria-hidden="true">*</span>}
              </label>
              <input
                id={`provider-${f.key}`}
                type={f.type}
                value={values[f.key]}
                onChange={(e) => setters[f.key](e.target.value)}
                required={f.required}
                className="ui-input"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ui-panel-footer">
        {onCancel && (
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-button">Add provider</button>
      </div>
    </form>
  );
}
