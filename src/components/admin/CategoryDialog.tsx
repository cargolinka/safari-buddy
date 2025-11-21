import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon_name: z.string().min(1, "Please select an icon"),
  image_url: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const iconOptions = [
  "Car", "Truck", "Bus", "Home", "Plane", "Ship", "Bike", "Train"
];

interface CategoryDialogProps {
  onSuccess: () => void;
  category?: any;
}

export function CategoryDialog({ onSuccess, category }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(category?.image_url || null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      name: category.name,
      description: category.description || "",
      icon_name: category.icon_name,
      image_url: category.image_url || "",
    } : undefined,
  });

  useEffect(() => {
    if (category && open) {
      setValue("name", category.name);
      setValue("description", category.description || "");
      setValue("icon_name", category.icon_name);
      setValue("image_url", category.image_url || "");
      setImagePreview(category.image_url || null);
    }
  }, [category, open, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue("image_url", "");
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);
    try {
      const slug = generateSlug(data.name);
      let imageUrl = data.image_url;

      // Upload image if a new file was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('category-images')
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('category-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from("vehicle_categories")
          .update({
            name: data.name,
            slug,
            description: data.description,
            icon_name: data.icon_name,
            image_url: imageUrl,
          })
          .eq("id", category.id);

        if (error) throw error;
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        // Create new category
        const { error } = await supabase.from("vehicle_categories").insert({
          name: data.name,
          slug,
          description: data.description,
          icon_name: data.icon_name,
          image_url: imageUrl,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Category created successfully" });
      }

      setOpen(false);
      reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {category ? (
          <Button variant="outline" size="sm">Edit</Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input {...register("name")} placeholder="e.g., SUV" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea {...register("description")} placeholder="Brief description of the category" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon_name">Icon</Label>
            <Select onValueChange={(value) => setValue("icon_name", value)} defaultValue={category?.icon_name}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.icon_name && (
              <p className="text-sm text-destructive">{errors.icon_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Category Image</Label>
            {imagePreview && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {imagePreview ? "Change Image" : "Upload Image"}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
