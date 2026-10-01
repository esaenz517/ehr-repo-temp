import { useCallback, useEffect, useState } from "react";
import {
  BillingChargeInput,
  billingApi,
} from "../api/billing";
import type { BillingCharge } from "../types";

export function useBilling(patientId: number | null) {
  const [charges, setCharges] = useState<BillingCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (patientId === null) {
      setCharges([]);
      return;
    }

    try {
      setLoading(true);
      const data = await billingApi.list(patientId);
      setCharges(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load charges"
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const createCharge = async (input: BillingChargeInput) => {
    if (patientId === null) return;

    try {
      await billingApi.create(patientId, input);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create charge"
      );
    }
  };

  const updateCharge = async (
    chargeId: number,
    input: BillingChargeInput
  ) => {
    if (patientId === null) return;

    try {
      await billingApi.update(patientId, chargeId, input);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update charge"
      );
    }
  };

  const removeCharge = async (chargeId: number) => {
    if (patientId === null) return;

    try {
      await billingApi.remove(patientId, chargeId);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete charge"
      );
    }
  };

  return {
    charges,
    loading,
    error,
    createCharge,
    updateCharge,
    removeCharge,
  };
}