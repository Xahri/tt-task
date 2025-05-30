/* eslint-disable react/display-name */
import { render, screen, waitFor } from "@testing-library/react";
import ProductTable from "./ProductTable";
import { ProductStore } from "@/app/store/ProductStore";
import { Product } from "@/app/types/product";
import { runInAction } from "mobx";

let mockProductStoreInstance: ProductStore;

jest.mock("@/app/store/StoreProvider", () => ({
  ...jest.requireActual("@/app/store/StoreProvider"),
  useStore: () => ({
    productStore: mockProductStoreInstance,
  }),
}));

jest.mock("./ProductTableRow", () => ({ product, columns }: any) => (
  <tr data-testid={`product-row-${product.id}`}>
    {columns.map((col: any) => (
      <td key={col.key}>{product[col.key]}</td>
    ))}
  </tr>
));

jest.mock(
  "react-infinite-scroll-component",
  () =>
    ({ children, hasMore, loader, endMessage }: any) =>
      (
        <div data-testid="infinite-scroll">
          <div>{children}</div>
          {hasMore && loader && (
            <div data-testid="infinite-scroll-loader">{loader}</div>
          )}
          {!hasMore && endMessage && (
            <div data-testid="infinite-scroll-end-message">{endMessage}</div>
          )}
        </div>
      )
);

const mockProductsPage1: Product[] = Array.from({ length: 5 }, (_, i) => ({
  id: `p1-${i + 1}`,
  name: `Product Page 1-${i + 1}`,
  category: "Cat1",
  price: 10 + i,
  stock: 5,
  supplier: "Sup1",
  description: "Desc P1",
  rating: 4.0 + i * 0.1,
}));

describe("ProductTable", () => {
  beforeEach(() => {
    mockProductStoreInstance = {
      ...new ProductStore(),
      loadInitialProducts: jest.fn().mockResolvedValue(undefined),
      loadMoreProducts: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProductStore;
  });

  const renderTable = () => render(<ProductTable />);

  it("calls loadInitialProducts on mount if products are empty and not loading", async () => {
    renderTable();
    await waitFor(() => {
      expect(
        mockProductStoreInstance.loadInitialProducts
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("does NOT call loadInitialProducts if products exist", async () => {
    runInAction(() => {
      mockProductStoreInstance.products = [...mockProductsPage1];
      mockProductStoreInstance.currentPage = 2; // simulate already loaded
    });
    renderTable();
    await new Promise((resolve) => setTimeout(resolve, 50)); // time for useEffects
    expect(mockProductStoreInstance.loadInitialProducts).not.toHaveBeenCalled();
  });

  it("renders table headers and product rows correctly", async () => {
    runInAction(() => {
      mockProductStoreInstance.products = [...mockProductsPage1];
    });
    renderTable();

    expect(screen.getByText("Product Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();

    for (const product of mockProductsPage1) {
      expect(
        await screen.findByTestId(`product-row-${product.id}`)
      ).toBeInTheDocument();
      expect(screen.getByText(product.name)).toBeInTheDocument();
    }
  });

  it("shows 'Yay! You have seen it all' when no more products and products exist", async () => {
    runInAction(() => {
      mockProductStoreInstance.products = [...mockProductsPage1];
      mockProductStoreInstance.hasMore = false;
      mockProductStoreInstance.isLoading = false;
    });
    renderTable();
    const endMessage = await screen.findByTestId("infinite-scroll-end-message");
    expect(endMessage).toHaveTextContent("Yay! You have seen it all");
  });

  it("shows 'No products found.' when products array is empty after loading and no more to load", async () => {
    runInAction(() => {
      mockProductStoreInstance.products = [];
      mockProductStoreInstance.isLoading = false;
      mockProductStoreInstance.hasMore = false;
    });
    renderTable();
    expect(await screen.findByText("No products found.")).toBeInTheDocument();
  });

  it("shows 'Error Loading More' alert when store has error and products exist", async () => {
    const errorMessage = "Failed to fetch next page";
    runInAction(() => {
      mockProductStoreInstance.products = [...mockProductsPage1];
      mockProductStoreInstance.error = errorMessage;
      mockProductStoreInstance.isLoading = false;
      mockProductStoreInstance.hasMore = true;
    });
    renderTable();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Error Loading More")).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
