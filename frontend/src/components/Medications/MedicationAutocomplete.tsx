import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { drugsApi } from "../../api/drugs";
import "./medicationAutocomplete.css";

interface MedicationAutocompleteProps {
  value: string; // what's typed in the box
  onChange: (value: string) => void; // every keystroke
  // A medication was chosen: a suggestion was clicked, or Enter/Tab accepted one.
  // Defaults to onChange (just put the name in the box).
  onSelect?: (name: string) => void;
  // Enter with no suggestion showing: use exactly what was typed (custom/rare medication).
  onEnterTyped?: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string; // extra classes for the <input>, e.g. "ui-input"
  invalid?: boolean;
}

const MIN_CHARS = 2; // start suggesting after this many letters
const DEBOUNCE_MS = 200; // wait for a pause in typing before asking the backend

// Text box that suggests ANY medication as you type (not just ones saved in the app).
// The most likely match is autofilled in grey after the cursor - press Tab, Enter,
// or the right arrow to accept it, or use the up/down arrows to pick another.
export function MedicationAutocomplete({
  value,
  onChange,
  onSelect = onChange,
  onEnterTyped,
  id,
  ariaLabel,
  placeholder = "Start typing a medication…",
  className = "",
  invalid = false,
}: MedicationAutocompleteProps) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // highlighted suggestion
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestNo = useRef(0); // ignore answers to old requests that arrive late
  const skipNextFetch = useRef(false); // don't re-open the list right after choosing

  // Ask the backend for suggestions shortly after the user stops typing.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const thisRequest = ++requestNo.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const names = await drugsApi.suggest(query);
        if (thisRequest !== requestNo.current) return;
        setSuggestions(names);
        setActive(0);
      } catch {
        if (thisRequest === requestNo.current) setSuggestions([]);
      } finally {
        if (thisRequest === requestNo.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const showList = open && focused && suggestions.length > 0 && value.trim().length >= MIN_CHARS;

  // Grey "autofill" text: the rest of the most likely match, when it starts with what was typed.
  const top = suggestions[showList ? active : 0];
  const ghost =
    focused && top && value && top.toLowerCase().startsWith(value.toLowerCase()) && top.length > value.length
      ? top.slice(value.length)
      : "";

  const choose = (name: string) => {
    skipNextFetch.current = true;
    requestNo.current++; // drop any request still in flight
    setLoading(false);
    setOpen(false);
    setSuggestions([]);
    onSelect(name);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const atEnd = e.currentTarget.selectionStart === value.length;
    switch (e.key) {
      case "ArrowDown":
        if (suggestions.length === 0) return;
        e.preventDefault();
        setOpen(true);
        setActive((i) => (showList ? (i + 1) % suggestions.length : 0));
        break;
      case "ArrowUp":
        if (!showList) return;
        e.preventDefault();
        setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        // Never submit the whole form from this box.
        e.preventDefault();
        if (showList) choose(suggestions[active]);
        else if (value.trim()) onEnterTyped?.(value.trim());
        break;
      case "Tab":
        // Accept the autofilled suggestion, then let Tab move to the next field as usual.
        if (showList && (ghost || active > 0)) choose(suggestions[active]);
        break;
      case "ArrowRight":
        if (ghost && atEnd) {
          e.preventDefault();
          choose(top);
        }
        break;
      case "Escape":
        if (showList) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <div className="med-ac">
      <div className="med-ac-field">
        {/* Typed text (invisible, just for spacing) + grey autofill of the rest of the name */}
        {ghost && (
          <div className="med-ac-ghost" aria-hidden="true">
            <span className="med-ac-ghost-typed">{value}</span>
            <span className="med-ac-ghost-rest">{ghost}</span>
          </div>
        )}
        <input
          id={id}
          className={`med-ac-input ${className}`}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="both"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setOpen(false);
          }}
        />
        {loading && focused && <span className="med-ac-spinner" aria-hidden="true" />}
      </div>

      {showList && (
        <ul id={listId} role="listbox" className="med-ac-list">
          {suggestions.map((name, i) => (
            <li
              key={name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`med-ac-option${i === active ? " med-ac-option--active" : ""}`}
              // mousedown (not click) so the input doesn't blur and close the list first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(name);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <Highlight text={name} query={value.trim()} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Bolds the part of a suggestion that matches what was typed.
function Highlight({ text, query }: { text: string; query: string }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || start < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <strong>{text.slice(start, start + query.length)}</strong>
      {text.slice(start + query.length)}
    </>
  );
}
