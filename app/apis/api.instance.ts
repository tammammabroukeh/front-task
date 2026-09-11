import type { ZodType } from "zod";

import { ErrorMessages } from "@/constants/errors";

import { FetchError } from "./types/fetch-error";
import { normalizeUrl } from "../../utils/normalizeUrl";

/**
 * Base API fetcher for the whole app.
 *
 * Responsibilities (single source of truth for HTTP concerns):
 * - Resolve the request URL against `BASE_URL`.
 * - Apply a request timeout via `AbortController`.
 * - Retry transient failures (timeout / network) with exponential backoff.
 * - Normalize every failure into a typed {@link FetchError}.
 * - Optionally validate the response body against a Zod schema.
 *
 * It intentionally holds no business logic — feature repositories build on top
 * of it (see `apis/services/<feature>/index.ts`).
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Request timeout in milliseconds. Read lazily so tests/env can override it. */
function getApiTimeout(): number {
  return Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000);
}

/** Maximum number of retries for transient (timeout/network) failures. */
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Extra options layered on top of the standard `fetch` init.
 * `next` (revalidate/tags) is provided by Next.js' global `RequestInit`
 * augmentation, so callers can pass caching options directly.
 */
export interface ApiRequestOptions extends RequestInit {
  /**
   * When provided, the parsed JSON body is validated against this schema.
   * A validation failure is surfaced as a `FetchError` of type `"validation"`.
   */
  schema?: ZodType;
  /** Skip default JSON headers (e.g. when sending `FormData`). */
  skipDefaultHeaders?: boolean;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export default async function apiFetcher<T>(
  path: string,
  options: ApiRequestOptions = {},
  retryCount = 0,
): Promise<T> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new FetchError(
      "BASE_URL is not configured. Set it in your environment.",
      null,
      undefined,
      "unknown",
    );
  }

  const { schema, skipDefaultHeaders, headers, ...rest } = options;

  const url = normalizeUrl(baseUrl, path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getApiTimeout());

  const isFormData = rest.body instanceof FormData;
  const hasBody = rest.body != null;
  const init: RequestInit = {
    method: rest.method ?? "GET",
    headers: buildHeaders(headers, hasBody, skipDefaultHeaders || isFormData),
    signal: controller.signal,
    ...rest,
  };

  try {
    const response = await fetch(url, init);
    clearTimeout(timeoutId);
    return await handleResponse<T>(response, schema);
  } catch (error) {
    clearTimeout(timeoutId);

    if (isRetryable(error) && retryCount < MAX_RETRIES) {
      await backoff(retryCount);
      return apiFetcher<T>(path, options, retryCount + 1);
    }

    throw normalizeError(error);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A browser-like User-Agent. Some upstreams (e.g. FakeStoreAPI behind
// Cloudflare) challenge requests from datacenter IPs that look like bare
// server fetches. Presenting a realistic UA + Accept reduces those blocks.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function buildHeaders(
  callerHeaders: HeadersInit | undefined,
  hasBody: boolean,
  skipContentType: boolean,
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": BROWSER_USER_AGENT,
  };

  // Only send Content-Type when there's actually a body. Sending it on a GET
  // is meaningless and can look bot-like to WAFs. For FormData, let the runtime
  // set the multipart boundary itself.
  if (hasBody && !skipContentType) {
    headers["Content-Type"] = "application/json";
  }

  return { ...headers, ...callerHeaders };
}

async function handleResponse<T>(
  response: Response,
  schema?: ZodType,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (response.ok) {
    // 204 No Content — nothing to parse.
    if (response.status === 204) {
      return true as T;
    }

    // FakeStoreAPI returns 200 with an empty body for missing resources;
    // parse defensively so an empty body becomes `null` instead of throwing.
    const raw = await response.text();
    const data: unknown = raw.length > 0 && isJson ? JSON.parse(raw) : null;

    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new FetchError(
          ErrorMessages.Validation,
          result.error.issues,
          response.status,
          "validation",
        );
      }
      return result.data as T;
    }

    return data as T;
  }

  // Non-2xx — try to surface the server's error payload.
  let info: unknown;
  try {
    info = isJson
      ? await response.json()
      : await response.text();
  } catch {
    info = null;
  }

  throw new FetchError(undefined, info, response.status, "http");
}

/** Timeout aborts and low-level network errors are worth retrying. */
function isRetryable(error: unknown): boolean {
  const isAbort = error instanceof DOMException && error.name === "AbortError";
  const isNetwork =
    error instanceof TypeError && /fetch failed|network/i.test(error.message);
  return isAbort || isNetwork;
}

function backoff(retryCount: number): Promise<void> {
  const delay = 1000 * (retryCount + 1);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/** Convert any thrown value into a typed {@link FetchError}. */
function normalizeError(error: unknown): FetchError {
  if (error instanceof FetchError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new FetchError(ErrorMessages.Timeout, null, 408, "timeout");
  }

  if (error instanceof TypeError) {
    return new FetchError(ErrorMessages.Network, error.message, undefined, "network");
  }

  return new FetchError(
    ErrorMessages.Default,
    error instanceof Error ? error.message : error,
    undefined,
    "unknown",
  );
}
