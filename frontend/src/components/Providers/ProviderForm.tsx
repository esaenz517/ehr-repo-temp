import { FormEvent, useState } from "react";
import type { CreateProviderInput } from "../../api/providers";

interface ProviderFormProps {
  onSubmit: (input: CreateProviderInput) => void;
}

export function ProviderForm({ onSubmit }: ProviderFormProps) {
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

  return (
    <form onSubmit={handleSubmit} className="ui-form-bar">
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
        className="ui-input"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
        className="ui-input"
      />
      <input
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        placeholder="Specialty"
        className="ui-input"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        className="ui-input"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="ui-input"
      />
      <button type="submit" className="ui-button">Add</button>
    </form>
  );
}
