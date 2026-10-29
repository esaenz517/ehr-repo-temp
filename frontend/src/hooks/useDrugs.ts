import { useCallback, useEffect, useState } from "react";
import { CreateDrugInput, drugsApi, UpdateDrugInput } from "../api/drugs";
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

  // Returns true when saved, so the list knows to close the edit row.
  const update = async (drugId: number, changes: UpdateDrugInput) => {
    try {
      await drugsApi.update(drugId, changes);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update drug");
      return false;
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

  return { drugs, loading, error, create, update, remove };
}
