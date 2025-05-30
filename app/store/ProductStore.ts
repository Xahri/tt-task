import { makeAutoObservable, runInAction } from "mobx";
import { Product, NewProduct } from "@/app/types/product";
import {
  fetchProducts,
  createProduct as apiCreateProduct,
} from "@/app/lib/api";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 15;

export class ProductStore {
  products: Product[] = [];
  isLoading = false;
  hasMore = true;
  currentPage = 1;
  error: string | null = null;
  isSubmitting = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadInitialProducts() {
    if (this.isLoading || (this.products.length > 0 && this.currentPage > 1)) {
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.currentPage = 1;
    this.products = [];
    this.hasMore = true;

    try {
      const newProducts = await fetchProducts(this.currentPage, ITEMS_PER_PAGE);

      runInAction(() => {
        this.products = newProducts;
        this.hasMore = newProducts.length === ITEMS_PER_PAGE;
        this.isLoading = false;
        if (newProducts.length > 0 || newProducts.length < ITEMS_PER_PAGE) {
          // if we got products or fewer than page size (means it was the last page)
          this.currentPage++;
        }
      });
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to load products";
        this.isLoading = false;
        this.hasMore = false; // Stop trying if initial load fails
        toast.error(this.error);
      });
    }
  }

  async loadMoreProducts() {
    if (this.isLoading || !this.hasMore) {
      return;
    }
    this.isLoading = true;

    try {
      const newProducts = await fetchProducts(this.currentPage, ITEMS_PER_PAGE);

      runInAction(() => {
        this.products = [...this.products, ...newProducts];
        this.hasMore = newProducts.length === ITEMS_PER_PAGE;
        this.isLoading = false;
        if (newProducts.length > 0 || newProducts.length < ITEMS_PER_PAGE) {
          this.currentPage++;
        }
      });
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to load more products";
        this.isLoading = false;
        toast.error(this.error);
      });
    }
  }

  async addProduct(newProductData: NewProduct) {
    this.isSubmitting = true;
    this.error = null; // Clear previous form submission errors
    try {
      const createdProduct = await apiCreateProduct(newProductData);
      runInAction(() => {
        this.products = [createdProduct, ...this.products]; // Add to top
        this.isSubmitting = false;
        toast.success("Product added successfully!");
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to create product";
        this.isSubmitting = false;
        toast.error(this.error || "Failed to create product.");
      });
      return false;
    }
  }

  reset() {
    this.products = [];
    this.isLoading = false;
    this.hasMore = true;
    this.currentPage = 1;
    this.error = null;
    this.isSubmitting = false;
  }
}
