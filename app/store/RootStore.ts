import { ProductStore } from "./ProductStore";

export class RootStore {
  productStore: ProductStore;

  constructor() {
    this.productStore = new ProductStore();
  }
}

let rootStore: RootStore | undefined;

export function getRootStore(): RootStore {
  if (typeof window === "undefined") {
    // Server-side rendering: New store
    return new RootStore();
  }
  // Client-side rendering: Singleton
  if (!rootStore) {
    rootStore = new RootStore();
  }
  return rootStore;
}
