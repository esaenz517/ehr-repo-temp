import { apiFetch } from "./client";

export interface GradeCriterion {
    criterion_key: string;
    label: string;
    possible_points: number;
    earned_points: number;
    comment: string | null;
}

export interface GradeSave {
    items: GradeCriterion[];
    adjustment_points: number;
    adjustment_reason: string | null;
}

export interface Grade extends GradeSave {
    assignment_id: number;
    case_id: number;
    course: string | null;

    assignment_type: "graded" | "practice";

    earned_points: number;
    possible_points: number;
    final_points: number;
    percentage: number;

    updated_at: string;
    published_at: string | null;
}

export interface ProgressItem {
    assignment_id: number;
    case_id: number;
    course: string | null;

    assigned_to: number;
    student_name: string;

    encounter_status:
    | "not_started"
    | "in_progress"
    | "submitted"
    | "signed";

    assigned_at: string;
    due_date: string | null;
    last_saved_at: string | null;

    idle_hours: number;

    alert: "inactive" | "overdue" | null;

    inactivity_threshold_hours: number | null;
}

export interface ProgressReport {
    total: number;
    not_started: number;
    in_progress: number;
    submitted: number;
    signed: number;

    inactive: number;
    overdue: number;

    assignments: ProgressItem[];
}

export const gradesApi = {
    student: () =>
        apiFetch<Grade[]>("/grades/student"),

    progress: () =>
        apiFetch<ProgressReport>(
            "/grades/instructor/progress"
        ),

    instructor: () =>
        apiFetch<Grade[]>("/grades/instructor"),

    one: (id: number) =>
        apiFetch<Grade | null>(
            `/grades/assignments/${id}`
        ),

    save: (id: number, data: GradeSave) =>
        apiFetch<Grade>(
            `/grades/assignments/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        ),

    publish: (id: number) =>
        apiFetch<Grade>(
            `/grades/assignments/${id}/publish`,
            {
                method: "POST",
            }
        ),
};