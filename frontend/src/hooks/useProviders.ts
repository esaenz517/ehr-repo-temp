import { useCallback, useEffect, useState } from "react";
import { CreateProviderInput, providersApi, UpdateProviderInput } from "../api/providers";
import type { Provider } from "../types";

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setProviders(await providersApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreateProviderInput) => {
    try {
      await providersApi.create(input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create provider");
    }
  };

  // Returns true when saved, so the list knows to close the edit row.
  const update = async (providerId: number, changes: UpdateProviderInput) => {
    try {
      await providersApi.update(providerId, changes);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update provider");
      return false;
    }
  };

  const remove = async (providerId: number) => {
    try {
      await providersApi.remove(providerId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider");
    }
  };

  return { providers, loading, error, create, update, remove };
}
