import { PatientForm } from "./Patients/PatientForm";
import { PatientList } from "./Patients/PatientList";
import { useDrugs } from "../hooks/useDrugs";
import { usePatients } from "../hooks/usePatients";
import { useProviders } from "../hooks/useProviders";

export function PatientsPage() {
  const { patients, loading, error, create, remove } = usePatients();
  const { providers } = useProviders();
  const { drugs } = useDrugs();

  return (
    <div>
      <h1>Patients</h1>

      <PatientForm providers={providers} drugs={drugs} onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <PatientList patients={patients} onDelete={remove} />}
    </div>
  );
}
