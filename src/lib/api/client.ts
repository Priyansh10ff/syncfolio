/**
 * Browser-side JSON fetch for the app's own API. Throws an Error carrying
 * the server's `error` message on any non-2xx response.
 */
export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status, data });
  }
  return data as T;
}
