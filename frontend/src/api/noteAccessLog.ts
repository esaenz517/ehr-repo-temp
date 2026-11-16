import { apiFetch } from "./client";

// AI was used to assist in building this frontend module

// One row of the clinical note access log (admin only; backend routers/note_access_log.py).
export interface NoteAccessEntry {
    note_access_log_id: number;
    occurred_at: string; // UTC
    actor_user_id: number | null;
    actor_username: string | null;
    actor_role: string | null;
    action: string;
    outcome: NoteAccessOutcome;
    status_code: number | null;
    note_id: number | null;
    patient_id: number | null;
    note_type: string | null;
    method: string;
    request_path: string;
    client_ip: string | null;
    details: string | null;
    // Red flag: a refused attempt on a psychiatry, psychotherapy or SUD note
    flagged: boolean;
}

export type NoteAccessOutcome =
    | "success"
    | "unauthenticated"
    | "denied"
    | "not_found"
    | "conflict"
    | "invalid"
    | "error";

export interface NoteAccessFilters {
    note_id?: number;
    patient_id?: number;
    action?: string;
    outcome?: string;
    flagged?: boolean;
    limit?: number;
    offset?: number;
}

export const noteAccessLogApi = {
    list: (filters: NoteAccessFilters = {}) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== "") params.set(key, String(value));
        }
        const query = params.toString();
        return apiFetch<{ total: number; flagged_total: number; items: NoteAccessEntry[] }>(
            `/audit/note-access${query ? `?${query}` : ""}`
        );
    },

    // Red flags logged in the last `days` days (for the sidebar badge)
    redFlags: (days = 7) =>
        apiFetch<{ days: number; count: number }>(`/audit/note-access/red-flags?days=${days}`),
};
