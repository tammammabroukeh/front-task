import { FetchError } from "@/app/apis/types/fetch-error";

/**
 * Development-only helpers to exercise the route's loading and error UI.
 *
 * These are gated behind env flags and are no-ops in production. They exist so
 * the `loading.tsx` and `error.tsx` states can be demonstrated on demand
 * (e.g. `?simulate=error` or `?simulate=slow`) without breaking real traffic.
 *
 * Usage: `/products?simulate=slow` or `/products?simulate=error`.
 * Enabled only when NODE_ENV !== "production".
 */

const isEnabled = process.env.NODE_ENV !== "production";

export type SimulateMode = "slow" | "error" | undefined;

export function parseSimulate(value: string | string[] | undefined): SimulateMode {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "slow" || v === "error") return v;
  return undefined;
}

/**
 * Apply the requested simulation. Delays to reveal the loading skeleton, or
 * throws a FetchError to trigger the error boundary.
 */
export async function applySimulation(mode: SimulateMode): Promise<void> {
  if (!isEnabled || !mode) return;

  if (mode === "slow") {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return;
  }

  if (mode === "error") {
    throw new FetchError(
      "Simulated failure to demonstrate the error boundary.",
      null,
      500,
      "http",
    );
  }
}
