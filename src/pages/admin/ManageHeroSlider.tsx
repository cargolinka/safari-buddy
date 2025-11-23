import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HeroSlideDialog } from "@/components/admin/HeroSlideDialog";

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
  created_at: string;
  updated_at: string;
}

export default function ManageHeroSlider() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);

  const { data: slides, isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("hero_slides")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Slide status updated");
    },
    onError: () => {
      toast.error("Failed to update slide status");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("hero_slides")
        .update({ display_order: newOrder })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Slide order updated");
    },
    onError: () => {
      toast.error("Failed to update slide order");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const slide = slides?.find((s) => s.id === id);
      if (slide?.image_url && slide.image_url.includes("hero-images")) {
        const path = slide.image_url.split("hero-images/")[1];
        if (path) {
          await supabase.storage.from("hero-images").remove([path]);
        }
      }

      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Slide deleted successfully");
      setDeleteDialogOpen(false);
      setSlideToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete slide");
    },
  });

  const handleMoveUp = (slide: HeroSlide) => {
    const currentIndex = slides?.findIndex((s) => s.id === slide.id) ?? -1;
    if (currentIndex > 0 && slides) {
      const previousSlide = slides[currentIndex - 1];
      reorderMutation.mutate({ id: slide.id, newOrder: previousSlide.display_order });
      reorderMutation.mutate({ id: previousSlide.id, newOrder: slide.display_order });
    }
  };

  const handleMoveDown = (slide: HeroSlide) => {
    const currentIndex = slides?.findIndex((s) => s.id === slide.id) ?? -1;
    if (currentIndex < (slides?.length ?? 0) - 1 && slides) {
      const nextSlide = slides[currentIndex + 1];
      reorderMutation.mutate({ id: slide.id, newOrder: nextSlide.display_order });
      reorderMutation.mutate({ id: nextSlide.id, newOrder: slide.display_order });
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSlideToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSlide(null);
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hero Slider Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage the hero carousel slides on the homepage
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Slide
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Subtitle</TableHead>
              <TableHead className="w-24">Order</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slides?.map((slide, index) => (
              <TableRow key={slide.id}>
                <TableCell>
                  {slide.image_url ? (
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{slide.title}</TableCell>
                <TableCell>{slide.subtitle}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(slide)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{slide.display_order}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(slide)}
                      disabled={index === (slides?.length ?? 0) - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: slide.id, is_active: checked })
                      }
                    />
                    <Badge variant={slide.is_active ? "default" : "secondary"}>
                      {slide.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(slide)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(slide.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <HeroSlideDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        slide={editingSlide}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone and
              will also delete the associated image from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => slideToDelete && deleteMutation.mutate(slideToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
