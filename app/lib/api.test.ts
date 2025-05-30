import { fetchProducts } from "@/app/lib/api";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { Product } from "@/app/types/product";

describe("API functions", () => {
  it("fetchProducts successfully retrieves products from MSW", async () => {
    const mockProducts: Product[] = [
      {
        id: "101",
        name: "Test Product 1",
        category: "Test",
        price: 10,
        stock: 1,
        supplier: "TS",
        description: "TP1",
      },
      {
        id: "102",
        name: "Test Product 2",
        category: "Test",
        price: 20,
        stock: 2,
        supplier: "TS",
        description: "TP2",
      },
    ];

    // override the default handler for this specific test
    server.use(
      http.get("http://localhost:3001/products", async () => {
        await delay(50);
        return HttpResponse.json(mockProducts);
      })
    );

    const products = await fetchProducts(1, 2); // page 1, limit 2
    expect(products).toEqual(mockProducts);
    expect(products.length).toBe(2);
  });

  it("fetchProducts handles MSW error", async () => {
    server.use(
      http.get("http://localhost:3001/products", async () => {
        await delay(50);
        return HttpResponse.json(
          { message: "MSW Forced Error" },
          { status: 500 }
        );
      })
    );

    await expect(fetchProducts(1, 5)).rejects.toThrow("MSW Forced Error");
  });
});
