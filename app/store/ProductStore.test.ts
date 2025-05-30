import { ProductStore } from "./ProductStore";
import {
  fetchProducts,
  createProduct as apiCreateProduct,
} from "@/app/lib/api";
import { toast } from "sonner";
import { Product, NewProduct } from "@/app/types/product";
import { runInAction } from "mobx";

jest.mock("@/app/lib/api", () => ({
  fetchProducts: jest.fn(),
  createProduct: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// for better intellisense and type checking
const mockedFetchProducts = fetchProducts as jest.MockedFunction<
  typeof fetchProducts
>;
const mockedApiCreateProduct = apiCreateProduct as jest.MockedFunction<
  typeof apiCreateProduct
>;
const mockedToast = toast as jest.Mocked<typeof toast>;

const ITEMS_PER_PAGE = 15; // similar to ProductStore.ts

describe("ProductStore", () => {
  let productStore: ProductStore;

  beforeEach(() => {
    productStore = new ProductStore();
    // reset mocks before each test
    mockedFetchProducts.mockClear();
    mockedApiCreateProduct.mockClear();
    mockedToast.success.mockClear();
    mockedToast.error.mockClear();
  });

  it("should have correct initial state", () => {
    expect(productStore.products).toEqual([]);
    expect(productStore.isLoading).toBe(false);
    expect(productStore.hasMore).toBe(true);
    expect(productStore.currentPage).toBe(1);
    expect(productStore.error).toBeNull();
    expect(productStore.isSubmitting).toBe(false);
  });

  describe("loadInitialProducts", () => {
    const mockProductsPage1: Product[] = Array.from(
      { length: ITEMS_PER_PAGE },
      (_, i) => ({
        id: `id-${i + 1}`,
        name: `Product ${i + 1}`,
        category: "Test Category",
        price: 10 + i,
        stock: 5 + i,
        supplier: "Test Supplier",
        description: `Description for product ${i + 1}`,
        rating: 4.0 + i * 0.1,
      })
    );

    it("should load initial products successfully and update state", async () => {
      mockedFetchProducts.mockResolvedValueOnce([...mockProductsPage1]);

      const loadPromise = productStore.loadInitialProducts();

      expect(productStore.isLoading).toBe(true);
      expect(productStore.error).toBeNull();

      await loadPromise;

      expect(mockedFetchProducts).toHaveBeenCalledWith(1, ITEMS_PER_PAGE);
      expect(productStore.products).toEqual(mockProductsPage1);
      expect(productStore.isLoading).toBe(false);
      expect(productStore.hasMore).toBe(true); // because ITEMS_PER_PAGE were returned
      expect(productStore.currentPage).toBe(2); // incremented for the next page
      expect(productStore.error).toBeNull();
    });

    it("should set hasMore to false if fewer than ITEMS_PER_PAGE are fetched", async () => {
      const partialProducts: Product[] = mockProductsPage1.slice(0, 5);
      mockedFetchProducts.mockResolvedValueOnce(partialProducts);

      await productStore.loadInitialProducts();

      expect(mockedFetchProducts).toHaveBeenCalledWith(1, ITEMS_PER_PAGE);
      expect(productStore.products).toEqual(partialProducts);
      expect(productStore.hasMore).toBe(false);
      expect(productStore.currentPage).toBe(2); // still increments as it was a successful fetch
      expect(productStore.isLoading).toBe(false);
    });

    it("should handle API errors and update state accordingly", async () => {
      const errorMessage = "Network Error";
      mockedFetchProducts.mockRejectedValueOnce(new Error(errorMessage));

      await productStore.loadInitialProducts();

      expect(mockedFetchProducts).toHaveBeenCalledWith(1, ITEMS_PER_PAGE);
      expect(productStore.isLoading).toBe(false);
      expect(productStore.products).toEqual([]);
      expect(productStore.error).toBe(errorMessage);
      expect(productStore.hasMore).toBe(false); // stop trying if first load fails
      expect(mockedToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it("should not fetch if already loading", async () => {
      runInAction(() => {
        productStore.isLoading = true;
      });

      await productStore.loadInitialProducts();
      expect(mockedFetchProducts).not.toHaveBeenCalled();
    });

    it("should correctly re-fetch and replace products if called again (when not blocked by guard)", async () => {
      const initialMockProducts: Product[] = mockProductsPage1.slice(
        0,
        ITEMS_PER_PAGE
      );
      mockedFetchProducts.mockResolvedValueOnce([...initialMockProducts]);
      await productStore.loadInitialProducts();

      expect(productStore.products).toEqual(initialMockProducts);
      expect(productStore.currentPage).toBe(2); // ready for page 2
      expect(mockedFetchProducts).toHaveBeenCalledTimes(1);
      mockedFetchProducts.mockClear(); // Clear
    });

    it("should not re-fetch initial products if products exist and currentPage > 1 (already paginated)", async () => {
      // to simulate that we have already loaded initial products or more
      runInAction(() => {
        productStore.products = [...mockProductsPage1];
        productStore.currentPage = 2; // any page > 1
        productStore.isLoading = false;
        productStore.hasMore = true;
      });

      mockedFetchProducts.mockClear(); // Clear any previous calls

      await productStore.loadInitialProducts();

      // (this.products.length > 0 && this.currentPage > 1) should prevent fetching
      expect(mockedFetchProducts).not.toHaveBeenCalled();
      // state should be the same/unchanged
      expect(productStore.products).toEqual(mockProductsPage1);
      expect(productStore.currentPage).toBe(2);
    });
  });

  describe("loadMoreProducts", () => {
    const mockProductsPage1: Product[] = Array.from(
      { length: ITEMS_PER_PAGE },
      (_, i) => ({
        id: `id-${i + 1}`,
        name: `Product ${i + 1}`,
        category: "Page1",
        price: 10,
        stock: 10,
        supplier: "S1",
        description: "D1",
        rating: 4,
      })
    );
    const mockProductsPage2: Product[] = Array.from(
      { length: ITEMS_PER_PAGE },
      (_, i) => ({
        id: `id-${ITEMS_PER_PAGE + i + 1}`,
        name: `Product ${ITEMS_PER_PAGE + i + 1}`,
        category: "Page2",
        price: 20,
        stock: 5,
        supplier: "S2",
        description: "D2",
        rating: 5,
      })
    );

    const setupInitialLoad = async () => {
      mockedFetchProducts.mockResolvedValueOnce([...mockProductsPage1]);
      await productStore.loadInitialProducts();
      mockedFetchProducts.mockClear();
    };

    it("should load more products successfully and append them", async () => {
      await setupInitialLoad(); // sets currentPage to 2, products to page1

      expect(productStore.currentPage).toBe(2); // ready for page 2
      mockedFetchProducts.mockResolvedValueOnce([...mockProductsPage2]);

      const loadMorePromise = productStore.loadMoreProducts();
      expect(productStore.isLoading).toBe(true);

      await loadMorePromise;

      expect(mockedFetchProducts).toHaveBeenCalledWith(2, ITEMS_PER_PAGE);
      expect(productStore.products.length).toBe(ITEMS_PER_PAGE * 2);
      expect(productStore.products).toEqual([
        ...mockProductsPage1,
        ...mockProductsPage2,
      ]);
      expect(productStore.isLoading).toBe(false);
      expect(productStore.hasMore).toBe(true);
      expect(productStore.currentPage).toBe(3);
      expect(productStore.error).toBeNull();
    });

    it("should set hasMore to false if fewer than ITEMS_PER_PAGE are fetched on loadMore", async () => {
      await setupInitialLoad();
      const partialProductsPage2 = mockProductsPage2.slice(0, 5);
      mockedFetchProducts.mockResolvedValueOnce(partialProductsPage2);

      await productStore.loadMoreProducts();

      expect(mockedFetchProducts).toHaveBeenCalledWith(2, ITEMS_PER_PAGE);
      expect(productStore.products.length).toBe(ITEMS_PER_PAGE + 5);
      expect(productStore.hasMore).toBe(false);
      expect(productStore.currentPage).toBe(3);
      expect(productStore.isLoading).toBe(false);
    });

    it("should handle API errors during loadMore and update state", async () => {
      await setupInitialLoad();
      const errorMessage = "Failed to load more";
      mockedFetchProducts.mockRejectedValueOnce(new Error(errorMessage));

      await productStore.loadMoreProducts();

      expect(mockedFetchProducts).toHaveBeenCalledWith(2, ITEMS_PER_PAGE);
      expect(productStore.isLoading).toBe(false);
      expect(productStore.products.length).toBe(ITEMS_PER_PAGE); // original products remain
      expect(productStore.error).toBe(errorMessage);

      expect(productStore.hasMore).toBe(true);
      expect(mockedToast.error).toHaveBeenCalledWith(errorMessage);
    });

    it("should not fetch if hasMore is false", async () => {
      await setupInitialLoad();
      runInAction(() => {
        productStore.hasMore = false;
      });
      mockedFetchProducts.mockClear();

      await productStore.loadMoreProducts();
      expect(mockedFetchProducts).not.toHaveBeenCalled();
      expect(productStore.isLoading).toBe(false);
    });

    it("should not fetch if already loading", async () => {
      await setupInitialLoad();
      runInAction(() => {
        productStore.isLoading = true;
      });
      mockedFetchProducts.mockClear();

      await productStore.loadMoreProducts();
      expect(mockedFetchProducts).not.toHaveBeenCalled();
    });

    it("should not fetch if initial load failed and hasMore is false", async () => {
      // simulate initial load failure
      mockedFetchProducts.mockRejectedValueOnce(
        new Error("Initial load failed")
      );
      await productStore.loadInitialProducts(); // to set hasMore to false

      expect(productStore.hasMore).toBe(false);
      mockedFetchProducts.mockClear();

      await productStore.loadMoreProducts();
      expect(mockedFetchProducts).not.toHaveBeenCalled();
    });
  });

  describe("addProduct", () => {
    const newProductData: NewProduct = {
      name: "Test New Product",
      category: "New Category",
      price: 99.99,
      stock: 10,
      supplier: "New Supplier",
      description: "A fantastic new product",
    };

    it("should handle API errors during product creation, update state, and show error toast", async () => {
      const errorMessage = "Failed to create product";
      mockedApiCreateProduct.mockRejectedValueOnce(new Error(errorMessage));

      const initialProductCount = productStore.products.length;
      const addPromise = productStore.addProduct(newProductData);

      expect(productStore.isSubmitting).toBe(true);

      const result = await addPromise;

      expect(mockedApiCreateProduct).toHaveBeenCalledWith(newProductData);
      expect(productStore.isSubmitting).toBe(false);
      expect(productStore.products.length).toBe(initialProductCount); // no product added
      expect(productStore.error).toBe(errorMessage);
      expect(mockedToast.error).toHaveBeenCalledWith(errorMessage);
      expect(result).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset all relevant store properties to their initial default values", () => {
      // change store state to be different
      runInAction(() => {
        productStore.products = [
          {
            id: "1",
            name: "Test",
            category: "Test",
            price: 1,
            stock: 1,
            supplier: "Test",
            description: "Test",
          },
        ];
        productStore.isLoading = true;
        productStore.hasMore = false;
        productStore.currentPage = 5;
        productStore.error = "An old error";
        productStore.isSubmitting = true;
      });

      // reset
      productStore.reset();

      // assert that all properties are back to their initial state
      expect(productStore.products).toEqual([]);
      expect(productStore.isLoading).toBe(false);
      expect(productStore.hasMore).toBe(true);
      expect(productStore.currentPage).toBe(1);
      expect(productStore.error).toBeNull();
      expect(productStore.isSubmitting).toBe(false);
    });
  });
});
