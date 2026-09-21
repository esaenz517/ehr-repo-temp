import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import { PatientForm } from "./components/Patients/PatientForm";
import { PatientList } from "./components/Patients/PatientList";
import { useItems } from "./hooks/useItems";
import { usePatients } from "./hooks/usePatients";

function App() {
  const { items, loading, error, create, remove } = useItems();
  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    create: createPatient,
    remove: removePatient,
  } = usePatients();

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Items</h1>

      <ItemForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <ItemList items={items} onDelete={remove} />}

      <h1>Patients</h1>

      <PatientForm onSubmit={createPatient} />

      {patientsError && <p style={{ color: "red" }}>{patientsError}</p>}
      {patientsLoading ? (
        <p>Loading...</p>
      ) : (
        <PatientList patients={patients} onDelete={removePatient} />
      )}
    </div>
  );
}

export default App;
