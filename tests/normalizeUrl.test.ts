import { test, expect, describe } from "bun:test";

import { normalizeUrl } from "@/app/utils/normalizeUrl";

describe("normalizeUrl", () => {
  test("joins base and path with a single slash", () => {
    expect(normalizeUrl("https://api.test", "products")).toBe(
      "https://api.test/products",
    );
  });

  test("strips a trailing slash from the base", () => {
    expect(normalizeUrl("https://api.test/", "products")).toBe(
      "https://api.test/products",
    );
  });

  test("keeps a leading slash on the path", () => {
    expect(normalizeUrl("https://api.test", "/products")).toBe(
      "https://api.test/products",
    );
  });

  test("does not duplicate the slash when both have one", () => {
    expect(normalizeUrl("https://api.test/", "/products")).toBe(
      "https://api.test/products",
    );
  });
});
