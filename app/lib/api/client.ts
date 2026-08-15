export type ApiJsonResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  rawBody: string;
  contentType: string;
};

function looksLikeJson(contentType: string, body: string) {
  const trimmed = body.trim();
  return contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[");
}

export async function readApiJson<T = Record<string, unknown>>(response: Response): Promise<ApiJsonResult<T>> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (process.env.NODE_ENV === "development") {
    console.error("[API response]", {
      url: response.url,
      status: response.status,
      contentType,
      body: rawBody.slice(0, 500),
    });
  }

  if (!looksLikeJson(contentType, rawBody)) {
    const error = rawBody.trim() || `Request failed with status ${response.status}`;
    return {
      ok: false,
      status: response.status,
      data: null,
      error,
      rawBody,
      contentType,
    };
  }

  try {
    const data = JSON.parse(rawBody) as T;
    const errorField = (data as { error?: unknown })?.error;
    const error = !response.ok
      ? String(errorField ?? `Request failed with status ${response.status}`)
      : null;

    return {
      ok: response.ok,
      status: response.status,
      data,
      error,
      rawBody,
      contentType,
    };
  } catch (parseError) {
    const details = parseError instanceof Error ? parseError.message : String(parseError);
    return {
      ok: false,
      status: response.status,
      data: null,
      error: `Invalid JSON response (${details})`,
      rawBody,
      contentType,
    };
  }
}
