export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Fired when the backend rejects the session cookie (expired, idle too long,
// or signed out elsewhere). App listens for it and returns to the login page.
export const SESSION_EXPIRED_EVENT = "session-expired";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);

  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    // Send the HttpOnly session cookie to the API on another port.
    credentials: "include",
  });

  if (res.status === 401 && !path.startsWith("/auth/")) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
