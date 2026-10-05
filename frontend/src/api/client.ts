export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);

  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // send the session cookie to the backend on another port
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}