import { FormEvent, useState } from "react";

import type {
  CreateStaffInput,
} from "../../api/staff";


interface StaffFormProps {
  onSubmit: (input: CreateStaffInput) => void;
  onCancel?: () => void; // shows a Cancel button that closes the form
}


export function StaffForm({
  onSubmit,
  onCancel,
}: StaffFormProps) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [admin, setAdmin] = useState(false);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !specialization.trim()
    ) {
      return;
    }

    onSubmit({
      first_name: firstName.trim(),
      middle_name: middleName.trim() || null,
      last_name: lastName.trim(),
      specialization: specialization.trim(),

      // Students must use the student creation workflow.
      student: false,
      admin,
    });

    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSpecialization("");
    setAdmin(false);
  };


  return (
    <form onSubmit={handleSubmit} className="ui-panel" aria-label="New staff member">
      <header className="ui-panel-header">
        <div className="ui-panel-heading">
          <h2 className="ui-panel-title">New staff member</h2>
          <p className="ui-panel-description">
            For instructors and other staff. Students are added with New student.
          </p>
        </div>
      </header>

      <div className="ui-panel-body">
        <div className="form-grid form-grid--4">
          <div className="form-field">
            <label htmlFor="staff-first-name">
              First name<span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="staff-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="ui-input"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-middle-name">Middle name</label>
            <input
              id="staff-middle-name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="ui-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-last-name">
              Last name<span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="staff-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="ui-input"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-specialization">
              Specialization<span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="staff-specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="ui-input"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-admin">Administrator</label>
            <select
              id="staff-admin"
              value={admin ? "yes" : "no"}
              onChange={(e) => setAdmin(e.target.value === "yes")}
              className="ui-input"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ui-panel-footer">
        {onCancel && (
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-button">
          Add staff member
        </button>
      </div>
    </form>
  );
}
