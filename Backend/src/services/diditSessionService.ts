import type { Env } from "../config/env";

const DEFAULT_BASE = "https://verification.didit.me";

/**
 * Fetch full session decision (useful if wallet is only present in session metadata).
 * @see https://docs.didit.me/sessions-api/retrieve-session
 */
export async function fetchDiditSessionDecision(
  env: Env,
  sessionId: string
): Promise<Record<string, unknown> | null> {
  if (!env.DIDIT_API_KEY) return null;
  const base = (env.DIDIT_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
  const url = `${base}/v3/session/${encodeURIComponent(sessionId)}/decision/`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": env.DIDIT_API_KEY,
    },
  });
  if (!res.ok) {
    console.error("Didit session decision fetch failed:", res.status, await res.text().catch(() => ""));
    return null;
  }
  return (await res.json()) as Record<string, unknown>;
}
