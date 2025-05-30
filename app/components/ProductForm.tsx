"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/app/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useStore } from "@/app/store/StoreProvider";
import { observer } from "mobx-react-lite";
import { Loader2 } from "lucide-react";
import { NewProduct } from "@/app/types/product";

// for form validation
const productFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Product name must be at least 3 characters." })
    .max(100),
  category: z.string().min(2, { message: "Category is required." }).max(50),
  price: z.coerce // for automatic string to number conversion
    .number({ invalid_type_error: "Price must be a number." })
    .positive({ message: "Price must be positive." })
    .finite(),
  stock: z.coerce
    .number({ invalid_type_error: "Stock must be a number." })
    .int({ message: "Stock must be a whole number." })
    .nonnegative({ message: "Stock can't be negative." }),
  supplier: z.string().min(2, { message: "Supplier is required." }).max(50),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." })
    .max(500)
    .optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onFormSubmitSuccess?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = observer(
  ({ onFormSubmitSuccess }) => {
    const { productStore } = useStore();

    const form = useForm<ProductFormValues>({
      resolver: zodResolver(productFormSchema),
      defaultValues: {
        name: "",
        category: "",
        price: 0,
        stock: 0,
        supplier: "",
        description: "",
      },
    });

    async function onSubmit(data: ProductFormValues) {
      const productData: NewProduct = {
        ...data,
        description: data.description || "",
      };

      const success = await productStore.addProduct(productData);
      if (success) {
        form.reset();
        onFormSubmitSuccess?.();
      }
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Wireless Mouse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Electronics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 29.99"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TechSupply Co." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of the product..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={productStore.isSubmitting}
            className="w-full"
          >
            {productStore.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {productStore.isSubmitting ? "Adding Product..." : "Add Product"}
          </Button>
          {productStore.error &&
            !productStore.isSubmitting && ( // Show general submission error if any
              <p className="text-sm font-medium text-destructive">
                {productStore.error}
              </p>
            )}
        </form>
      </Form>
    );
  }
);

export default ProductForm;
