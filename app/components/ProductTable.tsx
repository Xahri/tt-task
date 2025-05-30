"use client";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { observer } from "mobx-react-lite";
import InfiniteScroll from "react-infinite-scroll-component";
import { useStore } from "@/app/store/StoreProvider";
import { Product } from "@/app/types/product";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import ProductTableRow from "./ProductTableRow";

const ProductTable = observer(() => {
  const { productStore } = useStore();
  const scrollableDivRef = useRef<HTMLDivElement>(null);

  const columnConfig = useMemo(
    () => [
      {
        key: "name" as keyof Product,
        header: "Product Name",
        className: "font-medium",
      },
      { key: "category" as keyof Product, header: "Category" },
      {
        key: "price" as keyof Product,
        header: "Price",
        className: "text-right",
      },
      {
        key: "stock" as keyof Product,
        header: "Stock",
        className: "text-right",
      },
      { key: "supplier" as keyof Product, header: "Supplier" },
      {
        key: "rating" as keyof Product,
        header: "Rating",
        className: "text-center",
      },
    ],
    []
  );

  const checkAndLoadMore = useCallback(() => {
    if (productStore.isLoading || !productStore.hasMore) return;

    const div = scrollableDivRef.current;
    if (div) {
      const isScrollable = div.scrollHeight > div.clientHeight;
      // check if content is not scrollable and the scrollable area itself has some height
      // to avoid loops if the container starts with 0 height before content
      if (!isScrollable && div.clientHeight > 0) {
        productStore.loadMoreProducts();
      }
    }
  }, [productStore]);

  useEffect(() => {
    if (
      productStore.products.length === 0 &&
      !productStore.isLoading &&
      !productStore.error
    ) {
      console.log("ProductTable useEffect: Calling loadInitialProducts.");
      productStore.loadInitialProducts().then(() => {
        setTimeout(checkAndLoadMore, 150);
      });
    }
  }, [productStore, checkAndLoadMore]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productStore.products.length > 0 && !productStore.isLoading) {
        checkAndLoadMore();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [productStore.products, productStore.isLoading, checkAndLoadMore]);

  if (productStore.error && productStore.products.length === 0) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg">Error</AlertTitle>
        <AlertDescription>{productStore.error}</AlertDescription>
      </Alert>
    );
  }

  if (
    productStore.products.length === 0 &&
    !productStore.isLoading &&
    !productStore.hasMore
  ) {
    return (
      <div className="border rounded-md p-4 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }

  return (
    <div
      id="scrollableDiv"
      ref={scrollableDivRef}
      className="min-h-[300px] max-h-[70vh] overflow-auto border rounded-md"
    >
      <InfiniteScroll
        dataLength={productStore.products.length}
        next={productStore.loadMoreProducts}
        hasMore={productStore.hasMore}
        loader={
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Loading more...</p>
          </div>
        }
        endMessage={
          productStore.products.length > 0 && !productStore.hasMore ? (
            <p className="text-center py-4 text-sm text-muted-foreground">
              <b>Yay! You have seen it all</b>
            </p>
          ) : null
        }
        scrollableTarget="scrollableDiv"
      >
        <Table className="fixed-layout-table">
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow>
              {columnConfig.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {productStore.products.length > 0 &&
              productStore.products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  columns={columnConfig}
                />
              ))}
          </TableBody>
        </Table>
      </InfiniteScroll>
      {productStore.error && productStore.products.length > 0 && (
        <Alert variant="destructive" className="mt-4 sticky bottom-0 z-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading More</AlertTitle>
          <AlertDescription>{productStore.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
});

export default ProductTable;
