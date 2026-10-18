import { apiFetch } from "./client";

export type BatchStatus =
    | "ready"
    | "invalid"
    | "existing"
    | "created"
    | "failed";

export interface BatchStudentRow {
    row_number: number;
    email: string;
    name: string;
    username: string | null;
    status: BatchStatus;
    message: string;
    staffid: number | null;
    temporary_password: string | null;
}

export interface BatchStudentResult {
    validate_only: boolean;
    blocked: boolean;
    ready: number;
    created: number;
    existing: number;
    invalid: number;
    failed: number;
    rows: BatchStudentRow[];
}

export interface CreateStudentInput {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    specialization: string;
    email: string;
    username: string | null;
}

export const batchStudentsApi = {
    // Existing CSV preview and batch import.
    submit: (
        csvText: string,
        validateOnly: boolean
    ) =>
        apiFetch<BatchStudentResult>(
            "/staff/batch",
            {
                method: "POST",
                body: JSON.stringify({
                    csv_text: csvText,
                    validate_only: validateOnly,
                }),
            }
        ),

    // Create an individual student account.
    createOne: (input: CreateStudentInput) =>
        apiFetch<BatchStudentRow>(
            "/staff/student",
            {
                method: "POST",
                body: JSON.stringify(input),
            }
        ),
};