"use server";
import { FetchError } from "./types/error";
import { normalizeUrl } from "../utils/normalizeUrl";
import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { ErrorMessages } from "@/constants/errors";

// Configuration
const baseUrl = process.env.BASE_URL;
const aiBaseUrl = process.env.AI_BASE_URL
const DEFAULT_REVALIDATION_TIME = 3600 * 3; // 3 hours
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT || 50000);
const MAX_RETRIES = 2; // Retry failed requests up to 2 times

/**
 * Enhanced API fetcher with error handling, retry logic, and locale support
 * @param path - API endpoint path
 * @param requestInit - Fetch request options
 * @param retryCount - Current retry attempt (internal use)
 * @returns Promise with the response data
 */
export default async function apiFetcher<T>(
  path: string,
  requestInit?: RequestInit & { skipDefaultHeaders?: boolean },
  retryCount: number = 0,
  overridedBaseUrl?: boolean,
): Promise<T> {
  const myBaseUrl = overridedBaseUrl ? aiBaseUrl : baseUrl
  console.log("myBaseUrl", myBaseUrl);
  const url = normalizeUrl(myBaseUrl, path);
  const timeout = API_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  console.log('requestInit', requestInit)
  
  // Check if body is FormData - if so, don't set Content-Type (let browser handle it)
  const isFormData = requestInit?.body instanceof FormData;
  const skipDefaultHeaders = requestInit?.skipDefaultHeaders || isFormData;
  
  // Build headers conditionally
  const headers: HeadersInit = skipDefaultHeaders
    ? {
        // Don't set Content-Type for FormData
        Accept: "application/json",
        ...requestInit?.headers,
      }
    : {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...requestInit?.headers,
      };
  
  console.log('skipDefaultHeaders', skipDefaultHeaders);
  console.log('isFormData', isFormData);
  console.log('headers', headers);
  
  // Determine cache/revalidate settings.
  // IMPORTANT: `cache: "no-cache"` opts a request OUT of the Next.js Data Cache,
  // which also disables `next.tags` and makes `revalidateTag` a no-op.
  // So when the caller provides `next` options (tags/revalidate), we must NOT
  // force `no-cache` — otherwise the tag is never registered and cannot be revalidated.
  const hasCallerNextOptions = !!requestInit?.next;
  const cacheSetting =
    requestInit?.cache ?? (hasCallerNextOptions ? undefined : "no-cache");

  // `next` revalidate/tags cannot be combined with `cache: "no-store"`/"no-cache"
  // (Next.js warns and the options conflict). Only apply a `next` object when we
  // aren't forcing the request out of the cache.
  const isUncached = cacheSetting === "no-store" || cacheSetting === "no-cache";
  const nextSetting = requestInit?.next ??
    (isUncached ? undefined : { revalidate: DEFAULT_REVALIDATION_TIME });

  // Strip the caller's cache/next so our resolved values are the only ones applied
  // (prevents a leftover `next` from conflicting with a `no-store`/`no-cache` cache).
  const { cache: _callerCache, next: _callerNext, skipDefaultHeaders: _skip, ...restRequestInit } =
    requestInit ?? {};

    console.log('_callerCache', _callerCache)
    console.log('_callerNext', _callerNext)
    console.log('_skip', _skip)

  // Merge default options with provided options
  const init: RequestInit = {
    method: requestInit?.method ?? "GET",
    headers,
    signal: controller.signal,
    ...restRequestInit,
    // Only set cache when we actually have a value (avoid conflicting with next.tags)
    ...(cacheSetting ? { cache: cacheSetting } : {}),
    ...(nextSetting ? { next: nextSetting } : {}),
  };
  console.log(
    `Fetching: ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`,
  );
  console.log("init", init);
  try {
    const response = await fetch(url, init);
    console.log('response', response)
    console.log(
      `Fetch Response status:${response.status} statusText:${response.statusText} Ok:${response.ok}`,
    );
    console.log(
      url,
      JSON.stringify(response.url),
      JSON.stringify(response.body),
    );

    // Clean up timeout regardless of outcome
    clearTimeout(timeoutId);

    // Handle response based on status and content type
    return await handleResponse<T>(response);
  } catch (error) {
    console.log('error', error)
    clearTimeout(timeoutId);

    // Retry logic for timeout and network errors
    const isRetryableError =
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof TypeError && error.message.includes("fetch failed"));

    if (isRetryableError && retryCount < MAX_RETRIES) {
      console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1)),
      );
      return apiFetcher<T>(path, requestInit, retryCount + 1);
    }

    return handleFetchError(error, timeout);
  }
}
// if (
//   !contentType ||
//   !contentType.includes("application/json") ||
//   !response.ok
// ) {
//   errorInfo =
//     !contentType || !contentType.includes("application/json")
//       ? `Failed to read response body (${response.status} ${response.statusText})`
//       : await response.json();
//   throw new FetchError(undefined, errorInfo, response.status);
// }
/**
 * Handle API response based on status code and content type
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJsonResponse =
    contentType && contentType.includes("application/json");
  console.log("isJsonResponse", isJsonResponse);
  console.log("response", response);
  // Handle successful responses
  if (response.ok) {
    // Handle no-content responses
    if (response.status === 204) {
      return true as T;
    }

    // Parse and return JSON response
    if (isJsonResponse) {
      return await response.json();
    }
  }

  // Handle error responses
  let errorInfo: unknown;

  try {
    // Try to parse error response as JSON
    errorInfo = isJsonResponse
      ? await response.json()
      : `Failed to read response body (${response.status} ${response.statusText})`;
  } catch (parseError) {
    errorInfo = `Error parsing response: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
  }

  throw new FetchError(undefined, errorInfo, response.status);
}

/**
 * Handle fetch errors and categorize them appropriately
 */
function handleFetchError(error: unknown, timeout: number): never {
  console.log('error', error)
  // Handle abort errors specifically
  if (error instanceof DOMException && error.name === "AbortError") {
    console.error("Request timed out after", timeout, "ms");
    throw new FetchError(
      "Request timed out. Please try again later.",
      null,
      408,
    );
  }

  // Preserve FetchError instances
  if (error instanceof FetchError) {
    console.error(`API Error (${error.status}):`, error.message);
    throw error;
  }

  // Log and wrap other errors
  console.error("Fetch Error:", error);
  throw new FetchError(
    ErrorMessages.Default,
    error instanceof Error ? error.message : error,
  );
}
