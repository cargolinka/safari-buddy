import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlogCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any;
}

export const BlogCategoryDialog = ({
  open,
  onOpenChange,
  category,
}: BlogCategoryDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const name = watch("name");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
      });
    } else {
      reset({ name: "", slug: "", description: "" });
    }
  }, [category, reset]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!category && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  }, [name, category, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (category) {
        const { error } = await supabase
          .from("blog_categories")
          .update({
            name: data.name,
            slug: data.slug,
            description: data.description || null,
          })
          .eq("id", category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_categories").insert({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast({
        title: category ? "Category updated" : "Category created",
      });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error saving category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Safari Tips"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="e.g. safari-tips"
              {...register("slug", { required: "Slug is required" })}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this category..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : category
                ? "Update Category"
                : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
