import { useEffect, useState } from "react";
import { DrugStrength, drugsApi } from "../../api/drugs";
import { AutocompleteInput } from "./AutocompleteInput";

interface DoseAutocompleteProps {
  drugName: string; // the medication picked in the same row
  value: string;
  onChange: (value: string) => void;
  // A suggested strength was picked. route is the route that goes with it
  // (e.g. "PO" for tablets) or null, so the row can fill in Route when it's empty.
  onPick: (dose: string, route: string | null) => void;
  ariaLabel?: string;
  className?: string;
}

const LOOKUP_DELAY_MS = 300; // wait until the drug name stops changing

// Dose box that lists the real strengths the chosen drug comes in
// (e.g. Metformin -> "500 mg Tab", "850 mg Tab", "1000 mg Tab"). Free text still works.
export function DoseAutocomplete({ drugName, value, onChange, onPick, ariaLabel = "Dose", className }: DoseAutocompleteProps) {
  const [strengths, setStrengths] = useState<DrugStrength[]>([]);

  // Load the strengths whenever the drug changes.
  useEffect(() => {
    const name = drugName.trim();
    if (name.length < 2) {
      setStrengths([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      drugsApi
        .strengths(name)
        .then((list) => current && setStrengths(list))
        .catch(() => current && setStrengths([]));
    }, LOOKUP_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [drugName]);

  // Strengths that match what's typed ("500" or "500mg" both find "500 mg Tab"), prefix matches first.
  const filter = (query: string) => {
    const q = query.toLowerCase().replace(/\s+/g, "");
    const doses = strengths.map((s) => s.strength);
    if (!q) return doses;
    const squash = (d: string) => d.toLowerCase().replace(/\s+/g, "");
    return [...doses.filter((d) => squash(d).startsWith(q)), ...doses.filter((d) => !squash(d).startsWith(q) && squash(d).includes(q))];
  };

  const choose = (dose: string) => onPick(dose, strengths.find((s) => s.strength === dose)?.route ?? null);

  return (
    <AutocompleteInput
      className={className}
      ariaLabel={ariaLabel}
      placeholder={strengths.length > 0 ? "Pick or type a dose" : "e.g. 500 mg"}
      value={value}
      onChange={onChange}
      onSelect={choose}
      getSuggestions={filter}
      minChars={0}
      debounceMs={0}
      refreshKey={strengths}
    />
  );
}
