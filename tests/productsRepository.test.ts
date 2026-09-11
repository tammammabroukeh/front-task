import { test, expect, describe, afterEach } from "bun:test";

process.env.BASE_URL = "https://api.test";

import { productsRepository } from "@/app/apis/services/products";
import type { IProduct } from "@/app/apis/services/products/interface";

type FetchFn = typeof fetch;
const realFetch = globalThis.fetch;

function product(id: number): IProduct {
  return {
    id,
    title: `Product ${id}`,
    price: 9.99,
    description: "A test product.",
    category: "test",
    image: "https://api.test/img.png",
    rating: { rate: 4.2, count: 10 },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stub(response: Response) {
  globalThis.fetch = (async () => response) as FetchFn;
}

describe("productsRepository", () => {
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("getAllProducts returns a validated list", async () => {
    stub(jsonResponse([product(1), product(2)]));
    const list = await productsRepository.getAllProducts();
    expect(list).toHaveLength(2);
    expect(list[0].title).toBe("Product 1");
  });

  test("getProduct returns a validated product", async () => {
    stub(jsonResponse(product(5)));
    const p = await productsRepository.getProduct(5);
    expect(p?.id).toBe(5);
  });

  test("getProduct returns null for a missing product (empty body)", async () => {
    stub(
      new Response("", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const p = await productsRepository.getProduct(9999);
    expect(p).toBeNull();
  });

  test("getProduct returns null when the payload fails validation", async () => {
    stub(jsonResponse({ id: "bad" }));
    const p = await productsRepository.getProduct(1);
    expect(p).toBeNull();
  });

  test("getPaginatedProducts slices and reports metadata", async () => {
    const all = Array.from({ length: 20 }, (_, i) => product(i + 1));
    stub(jsonResponse(all));
    const result = await productsRepository.getPaginatedProducts(2, 8);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(8);
    expect(result.totalItems).toBe(20);
    expect(result.totalPages).toBe(3);
    expect(result.items).toHaveLength(8);
    expect(result.items[0].id).toBe(9); // page 2 starts at item 9
  });

  test("getPaginatedProducts clamps an out-of-range page", async () => {
    const all = Array.from({ length: 20 }, (_, i) => product(i + 1));
    stub(jsonResponse(all));
    const tooHigh = await productsRepository.getPaginatedProducts(99, 8);
    expect(tooHigh.page).toBe(3);

    stub(jsonResponse(all));
    const tooLow = await productsRepository.getPaginatedProducts(-5, 8);
    expect(tooLow.page).toBe(1);
  });
});
