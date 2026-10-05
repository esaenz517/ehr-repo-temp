import type { Patient } from "../../types";
import { Field } from "../FormField";

interface CasePatientSelectorProps {
    patients: Patient[];
    loading: boolean;
    error?: string;
    loadError: string | null;
    patientMode: "existing" | "new";
    selectedPatientId: number | null;
    loadingPatient: boolean;
    onSelectExisting: (patientId: number) => void;
    onSelectNew: () => void;
}

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
    onSelectNew,
}: CasePatientSelectorProps) {
    const value =
        patientMode === "new"
            ? "new"
            : selectedPatientId?.toString() || "";

    const handleChange = (selected: string) => {
        if (selected === "new") {
            onSelectNew();
            return;
        }

        if (selected) {
            onSelectExisting(Number(selected));
        }
    };

    return (
        <div className="form-grid">
            <Field
                id="case-patient"
                label="Patient"
                required
                error={error}
            >
                <select
                    id="case-patient"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={loading || loadingPatient}
                >
                    {loading && (
                        <option value="">
                            Loading patients…
                        </option>
                    )}

                    {!loading && (
                        <>
                            <option value="new">
                                Create new patient
                            </option>

                            {patients.map((patient) => (
                                <option
                                    key={patient.patient_id}
                                    value={patient.patient_id}
                                >
                                    {patient.last_name}, {patient.first_name}
                                    {patient.mrn ? ` — ${patient.mrn}` : ""}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </Field>

            {loadError && (
                <p className="field-error">
                    {loadError}
                </p>
            )}

            {loadingPatient && (
                <p className="field-hint">
                    Loading patient information…
                </p>
            )}

            {!loadingPatient && patientMode === "existing" && selectedPatientId && (
                <p className="field-hint">
                    Patient demographics and chart data were loaded from the database and cannot be edited here.
                </p>
            )}

            {!loadingPatient && patientMode === "new" && (
                <p className="field-hint">
                    Enter the new patient's information below. The patient will be saved when the case is created.
                </p>
            )}
        </div>
    );
}