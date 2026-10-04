import { FormEvent, useState } from "react";
import { useMedicalHistory } from "../../hooks/useMedicalHistory";
import "./history.css";

interface MedicalHistoryPanelProps {
  patientId: number;
}

// diagnosis_date comes back as "YYYY-MM-DD". Build the date from its parts so it
// isn't read as UTC midnight and shown as the previous day in US time zones.
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return dateFormat.format(new Date(year, month - 1, day));
};

export function MedicalHistoryPanel({
  patientId,
}: MedicalHistoryPanelProps) {
  const {
    medicalHistory,
    familyHistory,
    loading,
    error,
    createMedical,
    removeMedical,
    createFamily,
    removeFamily,
  } = useMedicalHistory(patientId);

  const [condition, setCondition] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [relationship, setRelationship] = useState("");
  const [familyCondition, setFamilyCondition] = useState("");
  const [familyNotes, setFamilyNotes] = useState("");

  const handleMedicalSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!condition.trim()) return;

    await createMedical({
      condition,
      diagnosis_date: diagnosisDate || null,
      notes: medicalNotes || null,
    });

    setCondition("");
    setDiagnosisDate("");
    setMedicalNotes("");
  };

  const handleFamilySubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!relationship.trim() || !familyCondition.trim()) return;

    await createFamily({
      relationship,
      condition: familyCondition,
      notes: familyNotes || null,
    });

    setRelationship("");
    setFamilyCondition("");
    setFamilyNotes("");
  };

  if (loading) {
    return <p className="history-muted">Loading history...</p>;
  }

  return (
    <div className="history-panel">
      {error && <p className="ui-error">{error}</p>}

      <div className="history-sections">
        {/* ---------- Medical history ---------- */}
        <section className="history-section" aria-labelledby={`medical-history-title-${patientId}`}>
          <div className="history-section-header">
            <h3 id={`medical-history-title-${patientId}`} className="history-section-title">
              Medical History
            </h3>
            <span className="history-count">{medicalHistory.length}</span>
          </div>

          {medicalHistory.length === 0 ? (
            <p className="history-empty">No medical history recorded.</p>
          ) : (
            <ul className="history-list">
              {medicalHistory.map((history) => (
                <li key={history.medical_history_id} className="history-entry">
                  <div className="history-entry-main">
                    <div className="history-entry-title">{history.condition}</div>
                    {history.diagnosis_date && (
                      <div className="history-entry-meta">
                        Diagnosed {formatDate(history.diagnosis_date)}
                      </div>
                    )}
                    {history.notes && <div className="history-entry-notes">{history.notes}</div>}
                  </div>

                  <button
                    type="button"
                    className="ui-button ui-button--danger history-delete"
                    onClick={() => removeMedical(history.medical_history_id)}
                    aria-label={`Delete ${history.condition}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleMedicalSubmit} className="history-form">
            <div className="history-field">
              <label htmlFor={`medical-condition-${patientId}`} className="history-label">
                Condition<span className="history-required" aria-hidden="true">*</span>
              </label>
              <input
                id={`medical-condition-${patientId}`}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Hypertension"
                required
                className="history-input"
              />
            </div>

            <div className="history-field">
              <label htmlFor={`medical-date-${patientId}`} className="history-label">
                Diagnosis date
              </label>
              <input
                id={`medical-date-${patientId}`}
                type="date"
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
                className="history-input"
              />
            </div>

            <div className="history-field history-field--full">
              <label htmlFor={`medical-notes-${patientId}`} className="history-label">
                Notes
              </label>
              <input
                id={`medical-notes-${patientId}`}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="history-input"
              />
            </div>

            <div className="history-form-actions">
              <button type="submit" className="ui-button">Add medical history</button>
            </div>
          </form>
        </section>

        {/* ---------- Family history ---------- */}
        <section className="history-section" aria-labelledby={`family-history-title-${patientId}`}>
          <div className="history-section-header">
            <h3 id={`family-history-title-${patientId}`} className="history-section-title">
              Family History
            </h3>
            <span className="history-count">{familyHistory.length}</span>
          </div>

          {familyHistory.length === 0 ? (
            <p className="history-empty">No family history recorded.</p>
          ) : (
            <ul className="history-list">
              {familyHistory.map((history) => (
                <li key={history.family_history_id} className="history-entry">
                  <div className="history-entry-main">
                    <div className="history-entry-title">
                      <span className="history-relationship">{history.relationship}</span>
                      {history.condition}
                    </div>
                    {history.notes && <div className="history-entry-notes">{history.notes}</div>}
                  </div>

                  <button
                    type="button"
                    className="ui-button ui-button--danger history-delete"
                    onClick={() => removeFamily(history.family_history_id)}
                    aria-label={`Delete ${history.relationship}: ${history.condition}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleFamilySubmit} className="history-form">
            <div className="history-field">
              <label htmlFor={`family-relationship-${patientId}`} className="history-label">
                Relationship<span className="history-required" aria-hidden="true">*</span>
              </label>
              <input
                id={`family-relationship-${patientId}`}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Mother"
                required
                className="history-input"
              />
            </div>

            <div className="history-field">
              <label htmlFor={`family-condition-${patientId}`} className="history-label">
                Condition<span className="history-required" aria-hidden="true">*</span>
              </label>
              <input
                id={`family-condition-${patientId}`}
                value={familyCondition}
                onChange={(e) => setFamilyCondition(e.target.value)}
                placeholder="e.g. Type 2 diabetes"
                required
                className="history-input"
              />
            </div>

            <div className="history-field history-field--full">
              <label htmlFor={`family-notes-${patientId}`} className="history-label">
                Notes
              </label>
              <input
                id={`family-notes-${patientId}`}
                value={familyNotes}
                onChange={(e) => setFamilyNotes(e.target.value)}
                className="history-input"
              />
            </div>

            <div className="history-form-actions">
              <button type="submit" className="ui-button">Add family history</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
