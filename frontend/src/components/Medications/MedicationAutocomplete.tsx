import { drugsApi } from "../../api/drugs";
import { AutocompleteInput, AutocompleteInputProps } from "./AutocompleteInput";

type MedicationAutocompleteProps = Omit<AutocompleteInputProps, "getSuggestions" | "minChars" | "refreshKey">;

// Text box that suggests ANY medication as you type (not just ones saved in the app).
export function MedicationAutocomplete({ placeholder = "Start typing a medication…", ...props }: MedicationAutocompleteProps) {
  return <AutocompleteInput {...props} placeholder={placeholder} getSuggestions={drugsApi.suggest} minChars={2} />;
}
