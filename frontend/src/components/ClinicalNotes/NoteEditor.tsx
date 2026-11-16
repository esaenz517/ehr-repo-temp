import type { NoteContent } from "../../api/clinicalNotes";
import type { NoteTemplate, NoteTemplateField } from "../../api/noteTemplates";

interface Props {
    template: NoteTemplate;
    content: NoteContent;
    disabled?: boolean;
    onChange: (content: NoteContent) => void;
}

// Any note type other than SOAP: the form is drawn from its template's
// sections and fields (GET /note-templates), so new types need no new editor.
export function NoteEditor({ template, content, disabled, onChange }: Props) {
    const set = (key: string, value: string) => onChange({ ...content, [key]: value });

    const input = (f: NoteTemplateField, id: string) => {
        const value = content[f.key] ?? "";

        switch (f.type) {
            case "longtext":
                return (
                    <textarea
                        id={id}
                        rows={3}
                        value={value}
                        maxLength={f.max_length}
                        disabled={disabled}
                        onChange={(e) => set(f.key, e.target.value)}
                    />
                );
            case "date":
                return (
                    <input id={id} type="date" value={value} disabled={disabled} onChange={(e) => set(f.key, e.target.value)} />
                );
            case "select":
                return (
                    <select id={id} value={value} disabled={disabled} onChange={(e) => set(f.key, e.target.value)}>
                        <option value="">Choose…</option>
                        {f.options.map((o) => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                    </select>
                );
            default:
                return (
                    <input
                        id={id}
                        value={value}
                        maxLength={f.max_length}
                        disabled={disabled}
                        onChange={(e) => set(f.key, e.target.value)}
                    />
                );
        }
    };

    return (
        <div className="soap-editor note-template-editor">
            {template.sections.map((section, i) => (
                <section key={section.title} className="soap-section" aria-labelledby={`note-section-${i}`}>
                    <h2 id={`note-section-${i}`}>{section.title}</h2>

                    {section.fields.map((f) => {
                        const id = `note-${f.key}`;
                        return (
                            <label key={f.key} className="note-field" htmlFor={id}>
                                <span>
                                    {f.label}
                                    {f.required && (
                                        <span className="note-required" aria-label="required before submitting">
                                            {" "}*
                                        </span>
                                    )}
                                </span>
                                {input(f, id)}
                                {f.hint && !disabled && <small className="note-hint">{f.hint}</small>}
                            </label>
                        );
                    })}
                </section>
            ))}

            {!disabled && template.sections.some((s) => s.fields.some((f) => f.required)) && (
                <p className="note-hint">* Required before the note is submitted. Drafts save without them.</p>
            )}
        </div>
    );
}
