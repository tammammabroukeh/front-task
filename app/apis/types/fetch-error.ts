import { ErrorMessages } from "@/constants/errors";

/**
 * Categorizes where/why a request failed so callers and UI boundaries can
 * branch on the type without string-matching messages.
 */
export type FetchErrorType =
  | "network" // could not reach the server (DNS/connection)
  | "timeout" // request aborted by the client timeout
  | "http" // server responded with a non-2xx status
  | "validation" // response shape failed schema validation
  | "unknown";

/**
 * Normalized transport/API error used across the whole API layer.
 *
 * - `message`  user-facing, safe to display.
 * - `info`     raw parsed error payload from the server (may be anything).
 * - `status`   HTTP status code when applicable.
 * - `type`     coarse category (see {@link FetchErrorType}).
 */
export class FetchError extends Error {
  readonly info: unknown;
  readonly status?: number;
  readonly type: FetchErrorType;

  constructor(
    message: string | undefined,
    info: unknown = null,
    status?: number,
    type: FetchErrorType = "unknown",
  ) {
    super(message ?? FetchError.messageForStatus(status));
    this.name = "FetchError";
    this.info = info;
    this.status = status;
    this.type = type;

    // Restore prototype chain when targeting ES5-ish transpilation.
    Object.setPrototypeOf(this, FetchError.prototype);
  }

  /** Picks a sensible default message from a status code. */
  private static messageForStatus(status?: number): string {
    switch (status) {
      case 404:
        return ErrorMessages.NotFound;
      case 401:
      case 403:
        return ErrorMessages.Unauthorized;
      case 408:
        return ErrorMessages.Timeout;
      default:
        return ErrorMessages.Default;
    }
  }
}

/** Narrowing helper for use in `catch` blocks and UI boundaries. */
export function isFetchError(error: unknown): error is FetchError {
  return error instanceof FetchError;
}
