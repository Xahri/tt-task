import { http, HttpResponse, delay } from "msw";
import { Product, NewProduct } from "@/app/types/product";

const productsDB: Product[] = [
  {
    id: 1,
    name: "Mocked Mouse",
    category: "Electronics",
    price: 20,
    stock: 10,
    supplier: "MockSupplier",
    description: "Desc 1",
    rating: 4,
  },
  {
    id: 2,
    name: "Mocked Keyboard",
    category: "Electronics",
    price: 50,
    stock: 5,
    supplier: "MockSupplier",
    description: "Desc 2",
    rating: 5,
  },
  {
    id: 3,
    name: "Mocked Monitor",
    category: "Electronics",
    price: 150,
    stock: 3,
    supplier: "MockSupplierB",
    description: "Desc 3",
    rating: 4.5,
  },
  {
    id: 4,
    name: "Mocked USB Hub",
    category: "Accessories",
    price: 25,
    stock: 15,
    supplier: "MockSupplierB",
    description: "Desc 4",
    rating: 4.2,
  },
  {
    id: 5,
    name: "Mocked SSD",
    category: "Storage",
    price: 80,
    stock: 8,
    supplier: "MockSupplierC",
    description: "Desc 5",
    rating: 4.8,
  },
];

const ITEMS_PER_PAGE_MSW = 15;

// Helper to simulate json-server's sorting
const getSortedProducts = () => {
  return [...productsDB].sort((a, b) => {
    const idA = Number(a.id);
    const idB = Number(b.id);
    return idB - idA; // Descending order by ID
  });
};

export const handlers = [
  http.get("http://localhost:3001/products", async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("_page") || "1");
    const limit = parseInt(
      url.searchParams.get("_limit") || String(ITEMS_PER_PAGE_MSW)
    ); // Default limit
    const start = (page - 1) * limit;
    const end = start + limit;
    const sortedProducts = getSortedProducts();
    const paginatedProducts = sortedProducts.slice(start, end);

    await delay(150); // Simulate network delay
    return HttpResponse.json(paginatedProducts);
  }),

  http.post("http://localhost:3001/products", async ({ request }) => {
    const newProductData = (await request.json()) as NewProduct;
    console.log("[MSW] POST /products", newProductData);

    const existingIds = productsDB
      .map((p) => p.id)
      .filter((id) => !isNaN(Number(id)));
    const maxId = existingIds.length > 0 ? Math.max(Number(...existingIds)) : 0;
    const newId = maxId + 1;

    const newProduct: Product = {
      id: newId,
      ...newProductData,
      rating:
        newProductData.rating || Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating
    };
    productsDB.unshift(newProduct); // Add to the beginning, so it appears first with descending sort
    await delay(150);
    return HttpResponse.json(newProduct, { status: 201 });
  }),
];
