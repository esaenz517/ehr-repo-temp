export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Development-only user identity used while the final login flow is unfinished.
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID;

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);

  headers.set("Content-Type", "application/json");

  if (DEV_USER_ID) {
    headers.set("X-User-Id", DEV_USER_ID);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}