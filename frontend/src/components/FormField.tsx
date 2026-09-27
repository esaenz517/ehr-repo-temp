import { ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string; // small helper text under the input
  error?: string; // validation message; shown in red when set
  children: ReactNode; // the input/select/textarea itself
}

// A label stacked above its input, with optional hint and error text.
// Used by the Create Case sections so every field looks the same.
export function Field({ id, label, required, hint, error, children }: FieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
