import { useCallback, useEffect, useState } from "react";
import {
  CreateFamilyHistoryInput,
  CreateMedicalHistoryInput,
  medicalHistoryApi,
} from "../api/medicalHistory";
import type { FamilyHistory, MedicalHistory } from "../types";

export function useMedicalHistory(patientId: number | null) {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [familyHistory, setFamilyHistory] = useState<FamilyHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (patientId === null) {
      setMedicalHistory([]);
      setFamilyHistory([]);
      return;
    }

    try {
      setLoading(true);

      const [medical, family] = await Promise.all([
        medicalHistoryApi.listMedical(patientId),
        medicalHistoryApi.listFamily(patientId),
      ]);

      setMedicalHistory(medical);
      setFamilyHistory(family);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const createMedical = async (input: CreateMedicalHistoryInput) => {
    if (patientId === null) return;

    try {
      await medicalHistoryApi.createMedical(patientId, input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add medical history");
    }
  };

  const removeMedical = async (medicalHistoryId: number) => {
    if (patientId === null) return;

    try {
      await medicalHistoryApi.removeMedical(patientId, medicalHistoryId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete medical history");
    }
  };

  const createFamily = async (input: CreateFamilyHistoryInput) => {
    if (patientId === null) return;

    try {
      await medicalHistoryApi.createFamily(patientId, input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add family history");
    }
  };

  const removeFamily = async (familyHistoryId: number) => {
    if (patientId === null) return;

    try {
      await medicalHistoryApi.removeFamily(patientId, familyHistoryId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete family history");
    }
  };

  return {
    medicalHistory,
    familyHistory,
    loading,
    error,
    createMedical,
    removeMedical,
    createFamily,
    removeFamily,
  };
}