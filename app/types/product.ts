export interface Product {
  id: number | string;
  name: string;
  category: string;
  price: number;
  stock: number;
  supplier: string;
  rating?: number;
  description: string;
}

export type NewProduct = Omit<Product, "id">;
