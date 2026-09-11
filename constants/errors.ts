/**
 * Centralized, user-facing error messages.
 * Kept framework-agnostic so they can be reused across the API layer,
 * server actions, and UI error boundaries.
 */
export const ErrorMessages = {
  Default: "Something went wrong. Please try again later.",
  Network: "Unable to reach the server. Check your connection and try again.",
  Timeout: "The request timed out. Please try again later.",
  NotFound: "The requested resource could not be found.",
  Unauthorized: "You are not authorized to perform this action.",
  Validation: "The server returned data in an unexpected format.",
} as const;

export type ErrorMessageKey = keyof typeof ErrorMessages;
