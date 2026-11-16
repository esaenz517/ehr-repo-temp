import type { ChartContext, NoteContent, SoapContent } from "../../api/clinicalNotes";
import { blankSoap } from "../../api/clinicalNotes";
import type { NoteTemplate } from "../../api/noteTemplates";
import { NoteEditor } from "./NoteEditor";
import { SoapEditor } from "./SoapEditor";

interface Props {
    noteType: string;
    // This type's template
    template: NoteTemplate | undefined;
    content: NoteContent;
    context: ChartContext;
    disabled?: boolean;
    onChange: (content: NoteContent) => void;
}

// The editor (or read-only view, with disabled) for any note type. SOAP keeps
// its own editor for the OLDCARTS prompts and chart panels; every other type's
// form is drawn from its template.
export function NoteBody({ noteType, template, content, context, disabled, onChange }: Props) {
    if (noteType === "SOAP") {
        return (
            <SoapEditor
                content={{ ...blankSoap(), ...content } as SoapContent}
                context={context}
                disabled={disabled}
                onChange={onChange}
            />
        );
    }

    if (!template) {
        return <p className="note-muted">Loading the note template…</p>;
    }

    return (
        <>
            {/* Restricted (mental health) notes: say who can open them */}
            {template.access === "author_only" ? (
                <p className="note-privacy">
                    Private process note: only its author can open it. For an assignment, the instructor reviews it there.
                </p>
            ) : template.privacy_class !== "baseline" ? (
                <p className="note-privacy">
                    Restricted note: only people in this note's discipline can open it, plus the instructor for an assignment.
                </p>
            ) : null}
            <NoteEditor template={template} content={content} disabled={disabled} onChange={onChange} />
        </>
    );
}
