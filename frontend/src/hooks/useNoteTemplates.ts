import { useEffect, useState } from "react";
import { noteTemplatesApi, type NoteTemplate } from "../api/noteTemplates";

// AI was utilized to assist with building this frontend module 

// Used until the list loads (or if it fails), so SOAP notes keep working.
const SOAP_ONLY: Pick<NoteTemplate, "id" | "label" | "enabled">[] = [
    { id: "SOAP", label: "SOAP note", enabled: true },
];

// Every clinical note type with its fields and policy, for the template
// dropdown. Types that aren't built yet come back with enabled: false.
export function useNoteTemplates() {
    const [templates, setTemplates] = useState<NoteTemplate[] | null>(null);

    useEffect(() => {
        let live = true;
        noteTemplatesApi
            .list()
            .then((rows) => live && setTemplates(rows))
            .catch(() => {
                // Keep the SOAP-only fallback; saving still checks types server-side
            });
        return () => {
            live = false;
        };
    }, []);

    return {
        templates: templates ?? SOAP_ONLY,
        loaded: templates !== null,
    };
}
