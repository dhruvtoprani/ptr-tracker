import type { AppState } from "../../shared/types";

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchState(): Promise<AppState> {
  return asJson<AppState>(await fetch("/api/state"));
}

export async function saveState(state: AppState): Promise<AppState> {
  return asJson<AppState>(
    await fetch("/api/state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(state)
    })
  );
}

export async function fetchSupervisorSummary(): Promise<string> {
  const data = await asJson<{ summary: string }>(await fetch("/api/supervisor-summary"));
  return data.summary;
}

export function downloadFromApi(path: string) {
  window.open(path, "_blank");
}
