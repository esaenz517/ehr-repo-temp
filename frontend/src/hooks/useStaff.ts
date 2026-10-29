import { useCallback, useEffect, useState } from "react";
import { CreateStaffInput, staffApi, UpdateStaffInput } from "../api/staff";
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

  // Returns true when saved, so the list knows to close the edit row.
  const update = async (staffId: number, changes: UpdateStaffInput) => {
    try {
      await staffApi.update(staffId, changes);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff member");
      return false;
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

  return { staff, loading, error, create, update, remove, reload: load };
}
