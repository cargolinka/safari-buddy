import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

const subcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  icon_name: z.string().optional(),
});

type SubcategoryFormData = z.infer<typeof subcategorySchema>;

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  category_id: string;
}

interface SubcategoryDialogProps {
  categories: Category[];
  subcategory?: Subcategory;
  onSuccess: () => void;
  defaultCategoryId?: string;
}

const SubcategoryDialog = ({ categories, subcategory, onSuccess, defaultCategoryId }: SubcategoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<SubcategoryFormData>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: subcategory?.name || "",
      description: subcategory?.description || "",
      category_id: subcategory?.category_id || defaultCategoryId || "",
      icon_name: subcategory?.icon_name || "Car",
    },
  });

  useEffect(() => {
    if (open) {
      if (subcategory) {
        form.reset({
          name: subcategory.name,
          description: subcategory.description || "",
          category_id: subcategory.category_id,
          icon_name: subcategory.icon_name || "Car",
        });
      } else {
        form.reset({
          name: "",
          description: "",
          category_id: defaultCategoryId || "",
          icon_name: "Car",
        });
      }
    }
  }, [subcategory, open, form, defaultCategoryId]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const onSubmit = async (data: SubcategoryFormData) => {
    setLoading(true);
    try {
      const slug = generateSlug(data.name);
      
      if (subcategory) {
        // Update existing subcategory
        const { error } = await supabase
          .from("vehicle_subcategories")
          .update({
            name: data.name,
            slug,
            description: data.description || null,
            category_id: data.category_id,
            icon_name: data.icon_name || "Car",
          })
          .eq("id", subcategory.id);

        if (error) throw error;
        toast.success("Subcategory updated successfully");
      } else {
        // Create new subcategory
        const { error } = await supabase
          .from("vehicle_subcategories")
          .insert({
            name: data.name,
            slug,
            description: data.description || null,
            category_id: data.category_id,
            icon_name: data.icon_name || "Car",
          });

        if (error) throw error;
        toast.success("Subcategory created successfully");
      }

      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save subcategory");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {subcategory ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subcategory
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {subcategory ? "Edit Subcategory" : "Create Subcategory"}
          </DialogTitle>
          <DialogDescription>
            {subcategory
              ? "Update the subcategory details below"
              : "Add a new vehicle subcategory to organize your fleet"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Premium, Standard" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this subcategory"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Car, Truck" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : subcategory ? "Update Subcategory" : "Create Subcategory"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcategoryDialog;
