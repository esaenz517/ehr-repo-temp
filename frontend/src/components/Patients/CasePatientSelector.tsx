import type { Patient } from "../../types";
import { Field } from "../FormField";
import "../Cases/cases.css";

interface CasePatientSelectorProps {
    patients: Patient[];
    loading: boolean;
    error?: string;
    loadError: string | null;
    patientMode: "existing" | "new";
    selectedPatientId: number | null;
    loadingPatient: boolean;
    onSelectExisting: (patientId: number) => void;
    onStartExisting: () => void;
    onSelectNew: () => void;
}

// The two ways to start a case, shown as choice cards.
const CHOICES = [
    {
        mode: "new",
        title: "New patient",
        text: "Enter demographics and chart data for someone who isn't in the system yet.",
    },
    {
        mode: "existing",
        title: "Existing patient",
        text: "Reuse a patient's chart. Their demographics and chart data are loaded read-only.",
    },
] as const;

// Lets the instructor either load an existing patient or start a new patient.
export function CasePatientSelector({
    patients,
    loading,
    error,
    loadError,
    patientMode,
    selectedPatientId,
    loadingPatient,
    onSelectExisting,
    onStartExisting,
    onSelectNew,
}: CasePatientSelectorProps) {
    const choose = (mode: "new" | "existing") => {
        if (mode === patientMode) return;
        if (mode === "new") onSelectNew();
        else onStartExisting();
    };

    return (
        <div className="form-stack">
            <div className="case-choices" role="radiogroup" aria-label="Patient">
                {CHOICES.map((choice) => (
                    <label
                        key={choice.mode}
                        className={`case-choice${patientMode === choice.mode ? " case-choice--selected" : ""}`}
                    >
                        <input
                            type="radio"
                            name="case-patient-mode"
                            value={choice.mode}
                            checked={patientMode === choice.mode}
                            onChange={() => choose(choice.mode)}
                            disabled={loadingPatient}
                        />
                        <span>
                            <span className="case-choice-title">{choice.title}</span>
                            <span className="case-choice-text">{choice.text}</span>
                        </span>
                    </label>
                ))}
            </div>

            {patientMode === "existing" && (
                <div className="case-patient-pick">
                    <Field id="case-patient" label="Patient" required error={error}>
                        <select
                            id="case-patient"
                            value={selectedPatientId?.toString() || ""}
                            onChange={(e) => e.target.value && onSelectExisting(Number(e.target.value))}
                            disabled={loading || loadingPatient}
                        >
                            <option value="">{loading ? "Loading patients…" : "Choose a patient"}</option>
                            {patients.map((patient) => (
                                <option key={patient.patient_id} value={patient.patient_id}>
                                    {patient.last_name}, {patient.first_name}
                                    {patient.mrn ? ` — ${patient.mrn}` : ""}
                                </option>
                            ))}
                        </select>
                    </Field>
                    {loadingPatient && <p className="field-hint">Loading patient information…</p>}
                </div>
            )}

            {loadError && <p className="field-error">{loadError}</p>}
        </div>
    );
}
