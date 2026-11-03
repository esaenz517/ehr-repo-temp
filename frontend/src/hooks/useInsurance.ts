
import { useCallback, useEffect, useState } from "react";
import { insuranceApi } from "../api/insurance";
import type { InsuranceInput } from "../api/insurance";
import type { PatientInsurance } from "../types";

export function useInsurance(patientId: number | null) {
  const [insurance, setInsurance] = useState<PatientInsurance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (patientId === null) {
      setInsurance([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await insuranceApi.list(patientId);
      setInsurance(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load insurance"
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createInsurance = async (input: InsuranceInput): Promise<boolean> => {
    if (patientId === null) return false;

    setSaving(true);
    setError(null);

    try {
      await insuranceApi.create(patientId, input);
      await load();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create insurance"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateInsurance = async (
    insuranceId: number,
    input: InsuranceInput
  ): Promise<boolean> => {
    if (patientId === null) return false;

    setSaving(true);
    setError(null);

    try {
      await insuranceApi.update(patientId, insuranceId, input);
      await load();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update insurance"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeInsurance = async (insuranceId: number): Promise<boolean> => {
    if (patientId === null) return false;

    setSaving(true);
    setError(null);

    try {
      await insuranceApi.remove(patientId, insuranceId);
      await load();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete insurance"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    insurance,
    loading,
    saving,
    error,
    load,
    createInsurance,
    updateInsurance,
    removeInsurance,
  };
}
