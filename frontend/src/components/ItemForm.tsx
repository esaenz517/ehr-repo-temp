import { FormEvent, useState } from "react";
import type { CreateItemInput } from "../api/items";

interface ItemFormProps {
  onSubmit: (input: CreateItemInput) => void;
}

export function ItemForm({ onSubmit }: ItemFormProps) {
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
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        style={{ flex: 1 }}
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        style={{ flex: 2 }}
      />
      <button type="submit">Add</button>
    </form>
  );
}
