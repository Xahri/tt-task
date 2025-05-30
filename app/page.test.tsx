import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "./page";
import { StoreProvider } from "@/app/store/StoreProvider";

jest.mock("@/app/components/ProductTable", () => {
  return function DummyProductTable() {
    return <div data-testid="product-table">Mocked Product Table</div>;
  };
});

jest.mock("@/app/components/ProductForm", () => {
  return function DummyProductForm({
    onFormSubmitSuccess,
  }: {
    onFormSubmitSuccess?: () => void;
  }) {
    return (
      <div data-testid="product-form">
        Mocked Product Form{" "}
        <button onClick={onFormSubmitSuccess}>Submit</button>
      </div>
    );
  };
});

describe("HomePage", () => {
  beforeEach(() => {});

  it("renders the main heading, add product button, and product table", () => {
    render(
      <StoreProvider>
        <HomePage />
      </StoreProvider>
    );

    expect(
      screen.getByRole("heading", { name: /product management/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add new product/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("product-table")).toBeInTheDocument();
  });

  it("opens the 'Add New Product' dialog when the button is clicked", async () => {
    render(
      <StoreProvider>
        <HomePage />
      </StoreProvider>
    );

    expect(
      screen.queryByRole("heading", { name: /add new product/i, level: 2 })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/fill in the details below to add a new product/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-form")).not.toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: /add new product/i });
    fireEvent.click(addButton);

    const dialogTitle = await screen.findByRole("heading", {
      name: /add new product/i,
      level: 2,
    });
    expect(dialogTitle).toBeInTheDocument();

    expect(
      await screen.findByText(/fill in the details below to add a new product/i)
    ).toBeInTheDocument();

    expect(await screen.findByTestId("product-form")).toBeInTheDocument();
  });

  it("closes the 'Add New Product' dialog when form submission is successful (mocked)", async () => {
    render(
      <StoreProvider>
        <HomePage />
      </StoreProvider>
    );

    const addButton = screen.getByRole("button", { name: /add new product/i });
    fireEvent.click(addButton);

    const productFormMock = await screen.findByTestId("product-form");
    expect(productFormMock).toBeInTheDocument();

    const mockSubmitButtonInForm = screen.getByRole("button", {
      name: /submit/i,
    });
    fireEvent.click(mockSubmitButtonInForm);

    await screen.findByRole("button", { name: /add new product/i });

    expect(
      screen.queryByRole("heading", { name: /add new product/i, level: 2 })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/fill in the details below to add a new product/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-form")).not.toBeInTheDocument();
  });
});
