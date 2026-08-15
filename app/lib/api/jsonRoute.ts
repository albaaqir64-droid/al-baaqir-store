import { NextResponse } from "next/server";

const JSON_HEADERS = { "Content-Type": "application/json" };

export function apiJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

export function apiError(error: string, status = 500, extra?: Record<string, unknown>) {
  return apiJson({ success: false, error, ...extra }, status);
}

const MAX_JSON_BODY_BYTES = 4 * 1024 * 1024;

export async function readRequestJson(request: Request): Promise<
  { ok: true; data: unknown } | { ok: false; response: NextResponse }
> {
  const contentType = request.headers.get("content-type") || "";
  if (request.method !== "GET" && request.method !== "HEAD" && !contentType.includes("application/json")) {
    return {
      ok: false,
      response: apiError("Content-Type must be application/json", 415),
    };
  }

  if (request.method === "GET" || request.method === "HEAD") {
    return { ok: true, data: null };
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    return {
      ok: false,
      response: apiError(
        `Request body is too large (${contentLength} bytes). Maximum allowed size is ${MAX_JSON_BODY_BYTES} bytes.`,
        413
      ),
    };
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("Unable to read request body:", details);
    return {
      ok: false,
      response: apiError("Unable to read request body", 400, { details }),
    };
  }

  if (rawBody.length > MAX_JSON_BODY_BYTES) {
    return {
      ok: false,
      response: apiError(
        `Request body is too large (${rawBody.length} bytes). Maximum allowed size is ${MAX_JSON_BODY_BYTES} bytes.`,
        413
      ),
    };
  }

  const trimmed = rawBody.trim();
  if (!trimmed) {
    return {
      ok: false,
      response: apiError("Request body must be valid JSON", 400),
    };
  }

  try {
    return { ok: true, data: JSON.parse(trimmed) };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("Invalid JSON request body:", details, rawBody.slice(0, 500));
    return {
      ok: false,
      response: apiError("Request body must be valid JSON", 400, { details }),
    };
  }
}

export async function readUpstreamJson(response: Response): Promise<
  { ok: true; data: unknown } | { ok: false; status: number; body: string }
> {
  const body = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const trimmed = body.trim();

  if (!trimmed) {
    return { ok: false, status: response.status, body: "" };
  }

  const looksJson = contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksJson) {
    return { ok: false, status: response.status, body: trimmed };
  }

  try {
    return { ok: true, data: JSON.parse(trimmed) };
  } catch {
    return { ok: false, status: response.status, body: trimmed };
  }
}

export function upstreamError(route: string, status: number, body: string) {
  console.error(`[${route}] upstream non-JSON response`, { status, body: body.slice(0, 500) });
  const message = body.trim() || `Upstream service returned status ${status}`;
  return apiError(message, status >= 400 ? status : 502, {
    upstreamStatus: status,
    upstreamBody: body.slice(0, 500),
  });
}
