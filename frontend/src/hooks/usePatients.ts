import { useCallback, useEffect, useState } from "react";
import { CreatePatientInput, patientsApi } from "../api/patients";
import type { Patient } from "../types";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPatients(await patientsApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreatePatientInput) => {
    try {
      await patientsApi.create(input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create patient");
    }
  };

  const remove = async (patientId: number) => {
    try {
      await patientsApi.remove(patientId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete patient");
    }
  };

  return { patients, loading, error, create, remove };
}
