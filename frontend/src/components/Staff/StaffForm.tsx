import { FormEvent, useState } from "react";
import type { CreateStaffInput } from "../../api/staff";

interface StaffFormProps {
  onSubmit: (input: CreateStaffInput) => void;
}

export function StaffForm({ onSubmit }: StaffFormProps) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [student, setStudent] = useState(false);
  const [admin, setAdmin] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !specialization.trim()) return;
    onSubmit({
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      specialization,
      student,
      admin,
    });
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSpecialization("");
    setStudent(false);
    setAdmin(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
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
        value={specialization}
        onChange={(e) => setSpecialization(e.target.value)}
        placeholder="Specialization"
        style={{ flex: 2 }}
      />
      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="checkbox"
          checked={student}
          onChange={(e) => setStudent(e.target.checked)}
        />
        Student
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="checkbox"
          checked={admin}
          onChange={(e) => setAdmin(e.target.checked)}
        />
        Admin
      </label>
      <button type="submit">Add</button>
    </form>
  );
}
