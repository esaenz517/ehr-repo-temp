import { useCallback, useEffect, useState } from "react";
import { portalAccountsApi, type PortalAccountInput } from "../api/portalAccounts";
import { usersApi } from "../api/users";
import type { PortalAccount } from "../types";

// apiFetch errors read "Request failed: <status>"; turn the known ones into plain words.
function createErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (message.endsWith("409")) return "That email or username is already in use.";
  if (message.endsWith("400")) return "Check the email and username (letters, numbers, and . _ @ + - only).";
  if (message.endsWith("403")) return "You don't have permission to create portal accounts.";
  return "Could not create the portal account.";
}

// A patient's portal account: load it, create one, and turn access on or off.
export function usePortalAccount(patientId: number) {
  const [account, setAccount] = useState<PortalAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Shown once after creating an account with a generated password
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAccount(await portalAccountsApi.get(patientId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the portal account");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: PortalAccountInput): Promise<boolean> => {
    try {
      const created = await portalAccountsApi.create(patientId, input);
      setTemporaryPassword(created.temporary_password ?? null);
      setAccount(created);
      setError(null);
      return true;
    } catch (err) {
      setError(createErrorMessage(err));
      return false;
    }
  };

  const setActive = async (active: boolean) => {
    if (!account) return;
    try {
      const updated = await usersApi.setStatus(account.user_id, active ? "active" : "disabled");
      setAccount({ ...account, account_status: updated.account_status as PortalAccount["account_status"] });
      setError(null);
    } catch {
      setError("Could not change portal access.");
    }
  };

  return { account, loading, error, temporaryPassword, create, setActive };
}
