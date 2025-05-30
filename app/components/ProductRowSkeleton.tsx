import { TableCell, TableRow } from "@/app/components/ui/table";
import { Skeleton } from "@/app/components/ui/skeleton";

interface ProductRowSkeletonProps {
  columns: number;
}

const ProductRowSkeleton = ({ columns }: ProductRowSkeletonProps) => {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
};

export default ProductRowSkeleton;
