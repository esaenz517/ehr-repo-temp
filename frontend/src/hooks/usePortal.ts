import { useEffect, useState } from "react";

// Loads one read-only patient portal resource, e.g. usePortal(portalApi.appointments).
// Pass a stable function (the portalApi members are) so it loads once per page.
export function usePortal<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true; // ignore a late response after the page closes
    setLoading(true);
    load()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load]);

  return { data, loading, error };
}
