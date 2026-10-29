"use client";

import { adminFetch } from "./adminFetch";
import { readApiJson } from "./api/client";

let visitTrackingRequest: Promise<void> | null = null;

export async function trackVisit() {
  if (typeof window === "undefined") return;

  const sessionKey = "baaqir_session_tracked";
  if (sessionStorage.getItem(sessionKey)) return;
  if (visitTrackingRequest) return visitTrackingRequest;

  visitTrackingRequest = (async () => {
    try {
      const response = await fetch("/api/analytics/visits", { method: "POST" });
      const result = await readApiJson<{ success?: boolean }>(response);
      if (!result.ok) throw new Error(result.error || "Could not track visit.");
      sessionStorage.setItem(sessionKey, "true");
    } catch (error) {
      console.error("Failed to track visit:", error);
    } finally {
      visitTrackingRequest = null;
    }
  })();

  return visitTrackingRequest;
}

export async function getVisitorCount(): Promise<number> {
  const response = await adminFetch("/api/analytics/visits");
  const result = await readApiJson<{ totalVisitors?: number }>(response);
  if (!result.ok || !result.data) {
    throw new Error(result.error || "Could not load visitor count.");
  }

  const count = Number(result.data.totalVisitors);
  if (!Number.isFinite(count) || count < 0) {
    throw new Error("The visitor count API returned an invalid value.");
  }

  return count;
}
