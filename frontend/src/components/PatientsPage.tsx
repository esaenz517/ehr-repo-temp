import { PatientForm } from "./Patients/PatientForm";
import { PatientList } from "./Patients/PatientList";
import { usePatients } from "../hooks/usePatients";

export function PatientsPage() {
  const { patients, loading, error, create, remove } = usePatients();

  return (
    <div>
      <h1>Patients</h1>

      <PatientForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <PatientList patients={patients} onDelete={remove} />}
    </div>
  );
}
