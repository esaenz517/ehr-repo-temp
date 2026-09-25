import { FormEvent, useState } from "react";
import { useMedicalHistory } from "../../hooks/useMedicalHistory";

interface MedicalHistoryPanelProps {
  patientId: number;
}

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
    return <p>Loading history...</p>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Medical History</h3>

      {medicalHistory.length === 0 ? (
        <p>No medical history recorded.</p>
      ) : (
        <ul>
          {medicalHistory.map((history) => (
            <li key={history.medical_history_id}>
              <strong>{history.condition}</strong>
              {history.diagnosis_date && (
                <> · Diagnosed: {history.diagnosis_date}</>
              )}
              {history.notes && <> · {history.notes}</>}

              <button
                type="button"
                onClick={() =>
                  removeMedical(history.medical_history_id)
                }
                style={{ marginLeft: 8 }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleMedicalSubmit}>
        <input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Condition"
        />

        <input
          type="date"
          value={diagnosisDate}
          onChange={(e) => setDiagnosisDate(e.target.value)}
        />

        <input
          value={medicalNotes}
          onChange={(e) => setMedicalNotes(e.target.value)}
          placeholder="Notes"
        />

        <button type="submit">Add Medical History</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Family History</h3>

      {familyHistory.length === 0 ? (
        <p>No family history recorded.</p>
      ) : (
        <ul>
          {familyHistory.map((history) => (
            <li key={history.family_history_id}>
              <strong>{history.relationship}</strong>
              {" · "}
              {history.condition}
              {history.notes && <> · {history.notes}</>}

              <button
                type="button"
                onClick={() =>
                  removeFamily(history.family_history_id)
                }
                style={{ marginLeft: 8 }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleFamilySubmit}>
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Relationship"
        />

        <input
          value={familyCondition}
          onChange={(e) => setFamilyCondition(e.target.value)}
          placeholder="Condition"
        />

        <input
          value={familyNotes}
          onChange={(e) => setFamilyNotes(e.target.value)}
          placeholder="Notes"
        />

        <button type="submit">Add Family History</button>
      </form>
    </div>
  );
}