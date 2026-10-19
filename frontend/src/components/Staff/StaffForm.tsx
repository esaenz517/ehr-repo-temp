import { FormEvent, useState } from "react";

import type {
  CreateStaffInput,
} from "../../api/staff";


interface StaffFormProps {
  onSubmit: (input: CreateStaffInput) => void;
}


export function StaffForm({
  onSubmit,
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
    <form
      onSubmit={handleSubmit}
      className="ui-form-bar"
    >
      <input
        value={firstName}
        onChange={(e) =>
          setFirstName(e.target.value)
        }
        placeholder="First Name"
        className="ui-input"
        required
      />

      <input
        value={middleName}
        onChange={(e) =>
          setMiddleName(e.target.value)
        }
        placeholder="Middle Name"
        className="ui-input"
      />

      <input
        value={lastName}
        onChange={(e) =>
          setLastName(e.target.value)
        }
        placeholder="Last Name"
        className="ui-input"
        required
      />

      <input
        value={specialization}
        onChange={(e) =>
          setSpecialization(e.target.value)
        }
        placeholder="Specialization"
        className="ui-input"
        required
      />

      <select
        value={admin ? "yes" : "no"}
        onChange={(e) =>
          setAdmin(e.target.value === "yes")
        }
        aria-label="Admin"
        className="ui-input"
      >
        <option value="no">
          Admin: No
        </option>

        <option value="yes">
          Admin: Yes
        </option>
      </select>

      <button
        type="submit"
        className="ui-button"
      >
        Add Staff
      </button>
    </form>
  );
}