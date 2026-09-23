import { useCallback, useEffect, useState } from "react";
import { CreateDrugInput, drugsApi } from "../api/drugs";
import type { Drug } from "../types";

export function useDrugs() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDrugs(await drugsApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drugs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreateDrugInput) => {
    try {
      await drugsApi.create(input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create drug");
    }
  };

  const remove = async (drugId: number) => {
    try {
      await drugsApi.remove(drugId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete drug");
    }
  };

  return { drugs, loading, error, create, remove };
}
