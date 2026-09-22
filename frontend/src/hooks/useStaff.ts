import { useCallback, useEffect, useState } from "react";
import { CreateStaffInput, staffApi } from "../api/staff";
import type { Staff } from "../types";

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setStaff(await staffApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreateStaffInput) => {
    try {
      await staffApi.create(input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create staff member");
    }
  };

  const remove = async (staffId: number) => {
    try {
      await staffApi.remove(staffId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff member");
    }
  };

  return { staff, loading, error, create, remove };
}
