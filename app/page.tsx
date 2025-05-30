"use client";
import { useState } from "react";
import ProductTable from "@/app/components/ProductTable";
import ProductForm from "@/app/components/ProductForm";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { PlusCircle } from "lucide-react";

export default function HomePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormSubmitSuccess = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new product to the catalog.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ProductForm onFormSubmitSuccess={handleFormSubmitSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ProductTable />
    </div>
  );
}
