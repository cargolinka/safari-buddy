import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
  display_order: number;
  is_active: boolean;
}

interface HeroSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide?: HeroSlide | null;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  display_order: number;
  is_active: boolean;
}

export function HeroSlideDialog({ open, onOpenChange, slide }: HeroSlideDialogProps) {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      button_text: "",
      button_link: "",
      secondary_button_text: "",
      secondary_button_link: "",
      display_order: 1,
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (slide) {
      reset({
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        button_text: slide.button_text,
        button_link: slide.button_link,
        secondary_button_text: slide.secondary_button_text || "",
        secondary_button_link: slide.secondary_button_link || "",
        display_order: slide.display_order,
        is_active: slide.is_active,
      });
      setImagePreview(slide.image_url);
    } else {
      reset({
        title: "",
        subtitle: "",
        description: "",
        button_text: "Browse Vehicles",
        button_link: "/vehicles",
        secondary_button_text: "Learn More",
        secondary_button_link: "/about",
        display_order: 1,
        is_active: true,
      });
      setImagePreview("");
    }
    setImageFile(null);
  }, [slide, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let imageUrl = slide?.image_url || "";

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("hero-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("hero-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const slideData = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        image_url: imageUrl,
        button_text: data.button_text,
        button_link: data.button_link,
        secondary_button_text: data.secondary_button_text || null,
        secondary_button_link: data.secondary_button_link || null,
        display_order: data.display_order,
        is_active: data.is_active,
      };

      if (slide) {
        const { error } = await supabase
          .from("hero_slides")
          .update(slideData)
          .eq("id", slide.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("hero_slides").insert(slideData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success(slide ? "Slide updated successfully" : "Slide created successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving slide:", error);
      toast.error("Failed to save slide");
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!imageFile && !slide?.image_url) {
      toast.error("Please select an image");
      return;
    }

    setUploading(true);
    try {
      await saveMutation.mutateAsync(data);
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{slide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
          <DialogDescription>
            {slide
              ? "Update the slide information and image"
              : "Create a new hero carousel slide. Recommended image dimensions: 1920x1080 (16:9 ratio)"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Hero Image *</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="image" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Change Image
                    </label>
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center h-48 cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Max 5MB • JPG, PNG, WEBP
                  </span>
                </label>
              )}
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: true })}
                placeholder="Adventure Awaits"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="subtitle">Subtitle *</Label>
              <Input
                id="subtitle"
                {...register("subtitle", { required: true })}
                placeholder="Premium Safari Vehicle Hire"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description", { required: true })}
                placeholder="Explore the wild with our top-quality safari vehicles..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_text">Primary Button Text *</Label>
              <Input
                id="button_text"
                {...register("button_text", { required: true })}
                placeholder="Browse Vehicles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_link">Primary Button Link *</Label>
              <Input
                id="button_link"
                {...register("button_link", { required: true })}
                placeholder="/vehicles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_button_text">Secondary Button Text</Label>
              <Input
                id="secondary_button_text"
                {...register("secondary_button_text")}
                placeholder="Learn More"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_button_link">Secondary Button Link</Label>
              <Input
                id="secondary_button_link"
                {...register("secondary_button_link")}
                placeholder="/about"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                {...register("display_order", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Saving..." : slide ? "Update Slide" : "Create Slide"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
