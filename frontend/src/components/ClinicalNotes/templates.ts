// Register future editors here when their storage and permissions are implemented.
export const NOTE_TEMPLATES = [
    {
        id: "SOAP",
        label: "SOAP note",
        enabled: true,
    },
    {
        id: "PROGRESS",
        label: "Progress note",
        enabled: false,
    },
    {
        id: "NURSING_SHIFT",
        label: "Nursing shift note",
        enabled: false,
    },
    {
        id: "PT_ASSESSMENT",
        label: "PT assessment",
        enabled: false,
    },
    {
        id: "PSYCHIATRY",
        label: "Psychiatry note",
        enabled: false,
    },
    {
        id: "DISCHARGE",
        label: "Discharge summary",
        enabled: false,
    },
    {
        id: "OTHER",
        label: "Other discipline-defined template",
        enabled: false,
    },
] as const;