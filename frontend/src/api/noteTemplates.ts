import { apiFetch } from "./client";

// One clinical note type and its security policy (backend app/note_templates.py).
export interface NoteTemplateField {
    key: string;
    label: string;
    type: "text" | "longtext" | "date" | "select";
    max_length: number;
    required: boolean; // must be filled in before the note is submitted
    options: string[]; // the choices of a select field
    hint: string | null;
}

export interface NoteTemplateSection {
    title: string;
    fields: NoteTemplateField[];
}

export interface NoteTemplate {
    id: string;
    label: string;
    enabled: boolean;
    version: number;
    privacy_class: "baseline" | "sensitive" | "psychotherapy" | "part2";
    access: "standard" | "care_team" | "author_only";
    portal: "default" | "review" | "never";
    author_disciplines: string[];
    purpose: string;
    regulatory_basis: string;
    sections: NoteTemplateSection[];
}

// Empty content with every field of the template
export const blankContent = (template: Pick<NoteTemplate, "sections">): Record<string, string> =>
    Object.fromEntries(template.sections.flatMap((s) => s.fields.map((f) => [f.key, ""])));

// author_disciplines entry meaning any discipline, but not "No discipline"
export const ANY_DISCIPLINE = "*";

// Whether someone with this discipline code (null = no discipline) may write the type
export const canAuthor = (template: Pick<NoteTemplate, "author_disciplines">, disciplineCode: string | null | undefined) =>
    template.author_disciplines.length === 0 ||
    (disciplineCode != null &&
        (template.author_disciplines.includes(ANY_DISCIPLINE) || template.author_disciplines.includes(disciplineCode)));

export const noteTemplatesApi = {
    list: () => apiFetch<NoteTemplate[]>("/note-templates"),
};