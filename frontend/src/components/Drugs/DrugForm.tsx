import { FormEvent, useState } from "react";
import type { CreateDrugInput } from "../../api/drugs";

interface DrugFormProps {
  onSubmit: (input: CreateDrugInput) => void;
}

export function DrugForm({ onSubmit }: DrugFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, description: description || null });
    setName("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="ui-form-bar">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="ui-input"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="ui-input ui-input--wide"
      />
      <button type="submit" className="ui-button">Add</button>
    </form>
  );
}
