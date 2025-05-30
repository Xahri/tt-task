import { TableCell, TableRow } from "@/app/components/ui/table";
import { Product } from "@/app/types/product";

interface ProductTableRowProps {
  product: Product;
  columns: Array<{
    key: keyof Product;
    header: string;
    className?: string;
  }>;
}

const ProductTableRow = ({ product, columns }: ProductTableRowProps) => {
  return (
    <TableRow key={product.id} className="hover:bg-muted/50 table-row-fade-in">
      {columns.map((col) => (
        <TableCell key={`${product.id}-${col.key}`} className={col.className}>
          {col.key === "price" && typeof product.price === "number"
            ? `$${Number(product.price).toFixed(2)}`
            : String(product[col.key as keyof Product] ?? "")}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default ProductTableRow;
