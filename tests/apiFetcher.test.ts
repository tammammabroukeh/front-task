import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { z } from "zod";

// BASE_URL must be present before importing the fetcher module.
process.env.BASE_URL = "https://api.test";

import apiFetcher from "@/app/apis/api.instance";
import { FetchError, isFetchError } from "@/app/apis/types/error";

type FetchFn = typeof fetch;
const realFetch = globalThis.fetch;

function stubFetch(response: Response) {
  globalThis.fetch = (async () => response) as FetchFn;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("apiFetcher", () => {
  beforeEach(() => {
    globalThis.fetch = realFetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("parses a successful JSON response", async () => {
    stubFetch(jsonResponse({ id: 1, title: "Item" }));
    const data = await apiFetcher<{ id: number; title: string }>("/x");
    expect(data).toEqual({ id: 1, title: "Item" });
  });

  test("returns null for an empty 200 body (FakeStore missing-resource case)", async () => {
    stubFetch(
      new Response("", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const data = await apiFetcher<unknown>("/products/9999");
    expect(data).toBeNull();
  });

  test("throws a typed FetchError on a non-2xx status", async () => {
    stubFetch(jsonResponse({ message: "nope" }, 500));
    try {
      await apiFetcher("/x");
      throw new Error("expected apiFetcher to throw");
    } catch (error) {
      expect(isFetchError(error)).toBe(true);
      expect((error as FetchError).status).toBe(500);
      expect((error as FetchError).type).toBe("http");
    }
  });

  test("validates the body against a provided Zod schema", async () => {
    stubFetch(jsonResponse({ id: "not-a-number" }));
    const schema = z.object({ id: z.number() });
    try {
      await apiFetcher("/x", { schema });
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(isFetchError(error)).toBe(true);
      expect((error as FetchError).type).toBe("validation");
    }
  });

  test("maps an aborted request to a timeout FetchError", async () => {
    globalThis.fetch = (async () => {
      throw new DOMException("aborted", "AbortError");
    }) as FetchFn;
    try {
      await apiFetcher("/x");
      throw new Error("expected timeout error");
    } catch (error) {
      expect(isFetchError(error)).toBe(true);
      expect((error as FetchError).type).toBe("timeout");
      expect((error as FetchError).status).toBe(408);
    }
  });
});
