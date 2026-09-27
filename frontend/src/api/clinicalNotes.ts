import { apiFetch } from "./client";

export interface SoapContent {
    chief_complaint: string;
    hpi: string;
    past_medical_history: string;
    past_surgical_history: string;
    family_history: string;
    social_history: string;
    physical_exam: string;
    assessment: string;
    plan: string;
}

export const blankSoap = (): SoapContent => ({
    chief_complaint: "",
    hpi: "",
    past_medical_history: "",
    past_surgical_history: "",
    family_history: "",
    social_history: "",
    physical_exam: "",
    assessment: "",
    plan: "",
});

// SQL Server DATETIME2 responses contain UTC clock time without an offset.
export const formatUtc = (value: string) =>
    new Date(
        /(?:Z|[+-]\d\d:\d\d)$/.test(value)
            ? value
            : `${value}Z`
    ).toLocaleString();

export interface ClinicalNote {
    note_id: number;
    patient_id: number;
    encounter_id: number;
    note_type: string;
    discipline: string | null;
    author_user_id: number;
    responsible_provider_id: number | null;
    created_at: string;
    last_modified_at: string;
    content: SoapContent;
    sensitivity_classification: "general" | "restricted";
    current_version: number;
    is_archived: boolean;
}

export interface NoteVersion {
    version_id: number;
    note_id: number;
    version_number: number;
    content_snapshot: SoapContent;
    author_user_id: number;
    created_at: string;
    change_summary: string | null;
}

export interface Encounter {
    encounter_id: number;
    patient_id: number;
    started_at: string;
}

export interface ChartContext {
    medical_history: {
        condition: string;
        diagnosis_date: string | null;
        notes: string | null;
    }[];

    family_history: {
        relationship: string;
        condition: string;
        notes: string | null;
    }[];

    medications: {
        name: string;
        dosage: string | null;
    }[];

    allergies: {
        substance: string;
        reaction: string | null;
    }[];

    latest_vitals: {
        recorded_at: string;
        blood_pressure: string | null;
        heart_rate: number | null;
        respiratory_rate: number | null;
        temperature_c: number | null;
        oxygen_saturation: number | null;
        height_cm: number | null;
        weight_kg: number | null;
    } | null;

    recent_labs: {
        test_name: string;
        result: string;
        unit: string | null;
        flag: string | null;
        collected_at: string;
    }[];
}

export const clinicalNotesApi = {
    context: (patientId: number) =>
        apiFetch<ChartContext>(
            `/patients/${patientId}/chart-context`
        ),

    encounters: (patientId: number) =>
        apiFetch<Encounter[]>(
            `/patients/${patientId}/encounters`
        ),

    startEncounter: (patientId: number) =>
        apiFetch<Encounter>(
            `/patients/${patientId}/encounters`,
            {
                method: "POST",
            }
        ),

    list: (
        patientId: number,
        includeArchived = false
    ) =>
        apiFetch<ClinicalNote[]>(
            `/patients/${patientId}/clinical-notes${includeArchived
                ? "?include_archived=true"
                : ""
            }`
        ),

    create: (
        patientId: number,
        encounterId: number,
        content: SoapContent,
        sensitivity: "general" | "restricted"
    ) =>
        apiFetch<ClinicalNote>(
            "/clinical-notes",
            {
                method: "POST",
                body: JSON.stringify({
                    patient_id: patientId,
                    encounter_id: encounterId,
                    note_type: "SOAP",
                    sensitivity_classification: sensitivity,
                    content,
                }),
            }
        ),

    save: (
        noteId: number,
        version: number,
        content: SoapContent,
        summary: string
    ) =>
        apiFetch<ClinicalNote>(
            `/clinical-notes/${noteId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    expected_version: version,
                    content,
                    change_summary: summary || null,
                }),
            }
        ),

    versions: (noteId: number) =>
        apiFetch<NoteVersion[]>(
            `/clinical-notes/${noteId}/versions`
        ),

    archive: (noteId: number) =>
        apiFetch<void>(
            `/clinical-notes/${noteId}`,
            {
                method: "DELETE",
            }
        ),
};