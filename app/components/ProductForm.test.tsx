import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductForm from "./ProductForm";
import { ProductStore } from "@/app/store/ProductStore";
import { NewProduct } from "@/app/types/product";

let mockProductStoreInstance: ProductStore;
const mockOnFormSubmitSuccess = jest.fn();

jest.mock("@/app/store/StoreProvider", () => ({
  ...jest.requireActual("@/app/store/StoreProvider"),
  useStore: () => ({
    productStore: mockProductStoreInstance,
  }),
}));

describe("ProductForm", () => {
  beforeEach(() => {
    // new object for mocking to avoid issues with MobX auto-binding and Jest spies
    mockProductStoreInstance = {
      ...new ProductStore(),
      addProduct: jest.fn().mockResolvedValue(true),
    } as unknown as ProductStore;

    mockOnFormSubmitSuccess.mockClear();
  });

  afterEach(() => {});

  const renderProductForm = () => {
    return render(
      <ProductForm onFormSubmitSuccess={mockOnFormSubmitSuccess} />
    );
  };

  it("renders all form fields and the submit button", () => {
    renderProductForm();

    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add product/i })
    ).toBeInTheDocument();
  });

  it("allows typing into form fields", async () => {
    const user = userEvent.setup();
    renderProductForm();

    const nameInput = screen.getByLabelText(/product name/i);
    await user.type(nameInput, "Test Product");
    expect(nameInput).toHaveValue("Test Product");

    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, "123.45");
    expect(priceInput).toHaveValue(123.45);
  });

  it("shows validation error for required fields if submitted empty", async () => {
    const user = userEvent.setup();
    renderProductForm();

    const submitButton = screen.getByRole("button", { name: /add product/i });
    await user.click(submitButton);

    expect(
      await screen.findByText("Product name must be at least 3 characters.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Category is required.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Price must be positive.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Supplier is required.")
    ).toBeInTheDocument();
  });

  it("shows validation error for min length (e.g. product name)", async () => {
    const user = userEvent.setup();
    renderProductForm();

    const nameInput = screen.getByLabelText(/product name/i);
    await user.type(nameInput, "A");

    const submitButton = screen.getByRole("button", { name: /add product/i });
    await user.click(submitButton);

    expect(
      await screen.findByText("Product name must be at least 3 characters.")
    ).toBeInTheDocument();
  });

  it("shows validation error for price (e.g. not positive)", async () => {
    const user = userEvent.setup();
    renderProductForm();

    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, "0");

    const submitButton = screen.getByRole("button", { name: /add product/i });
    await user.click(submitButton);

    expect(
      await screen.findByText("Price must be positive.")
    ).toBeInTheDocument();
  });

  it("submits valid data correctly and calls store.addProduct, resets form, and calls onFormSubmitSuccess", async () => {
    const user = userEvent.setup();
    renderProductForm();

    const testProductData: NewProduct = {
      name: "Super Gadget",
      category: "Electronics",
      price: 99.99,
      stock: 50,
      supplier: "Gadget Corp",
      description: "The best super gadget ever made for testing.",
    };

    await user.type(
      screen.getByLabelText(/product name/i),
      testProductData.name
    );
    await user.type(
      screen.getByLabelText(/category/i),
      testProductData.category
    );
    await user.clear(screen.getByLabelText(/price/i));
    await user.type(
      screen.getByLabelText(/price/i),
      String(testProductData.price)
    );
    await user.clear(screen.getByLabelText(/stock quantity/i));
    await user.type(
      screen.getByLabelText(/stock quantity/i),
      String(testProductData.stock)
    );
    await user.type(
      screen.getByLabelText(/supplier/i),
      testProductData.supplier
    );
    await user.type(
      screen.getByLabelText(/description/i),
      testProductData.description
    );

    const submitButton = screen.getByRole("button", { name: /add product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProductStoreInstance.addProduct).toHaveBeenCalledWith(
        testProductData
      );
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/product name/i)).toHaveValue("");
    });
    expect(mockOnFormSubmitSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/must be at least/i)).not.toBeInTheDocument();
  });
});
