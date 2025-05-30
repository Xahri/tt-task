import { Product, NewProduct } from "@/app/types/product";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
    } else {
      errorData = await response.text();
    }

    const message =
      errorData?.message ||
      (typeof errorData === "string"
        ? errorData
        : `API request failed with status ${response.status}`);
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

// async function artificialDelay(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

export async function fetchProducts(
  page: number,
  limit: number
): Promise<Product[]> {
  // FOR DEBUGGING LOADER VISIBILITY ONLY
  // if (process.env.NODE_ENV === "development") {
  //   await artificialDelay(500);
  // }
  const response = await fetch(
    `${API_BASE_URL}/products?_page=${page}&_limit=${limit}&_sort=id&_order=desc`
  );
  return handleResponse<Product[]>(response);
}

export async function createProduct(productData: NewProduct): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });
  const newProduct = await handleResponse<Product>(response);
  return newProduct;
}
