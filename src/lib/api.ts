import type { AppState } from "../../shared/types";

type LoginResponse = {
  token: string;
  username: string;
  expiresInSeconds: number;
};

let authToken: string | null = null;

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  return headers;
}

function getDownloadFilename(response: Response, fallback = "download.csv"): string {
  const disposition = response.headers.get("Content-Disposition");
  if (!disposition) return fallback;
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  return match?.[1] ?? fallback;
}

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { error?: string };
      throw new Error(parsed.error || text || `Request failed with ${response.status}`);
    } catch {
      throw new Error(text || `Request failed with ${response.status}`);
    }
  }
  return (await response.json()) as T;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const payload = await asJson<LoginResponse>(response);
  setAuthToken(payload.token);
  return payload;
}

export async function logout() {
  if (!authToken) return;
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: buildHeaders()
  });
  clearAuthToken();
}

export async function fetchState(): Promise<AppState> {
  return asJson<AppState>(await fetch("/api/state", { headers: buildHeaders() }));
}

export async function saveState(state: AppState): Promise<AppState> {
  return asJson<AppState>(
    await fetch("/api/state", {
      method: "PUT",
      headers: buildHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(state)
    })
  );
}

export async function fetchSupervisorSummary(): Promise<string> {
  const data = await asJson<{ summary: string }>(
    await fetch("/api/supervisor-summary", { headers: buildHeaders() })
  );
  return data.summary;
}

export async function downloadFromApi(path: string, fallbackName = "export.csv") {
  const response = await fetch(path, { headers: buildHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Download failed with ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = getDownloadFilename(response, fallbackName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}
