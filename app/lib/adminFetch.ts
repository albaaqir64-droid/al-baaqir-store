"use client";

import { auth } from "./firebase";

/**
 * A wrapper around the native fetch API that automatically attaches
 * the current Firebase user's ID token to the Authorization header.
 * Used for admin API requests.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    // If not logged in, just proceed with normal fetch (it will likely fail with 401 on the server)
    return fetch(input, init);
  }

  try {
    const token = await user.getIdToken();

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error("Error getting auth token for adminFetch:", error);
    return fetch(input, init);
  }
}
