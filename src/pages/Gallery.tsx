import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, ArrowLeft, FolderOpen } from "lucide-react";
import heroImage from "@/assets/hero-safari-3.jpg";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category_id: string | null;
  vehicle_categories?: {
    name: string;
  } | null;
}

interface CategoryWithCount {
  id: string;
  name: string;
  image_url: string | null;
  image_count: number;
}

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithCount | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch categories with image counts
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["gallery-categories-with-counts"],
    queryFn: async () => {
      // First get all categories
      const { data: cats, error: catsError } = await supabase
        .from("vehicle_categories")
        .select("id, name, image_url")
        .order("name");
      
      if (catsError) throw catsError;

      // Then get image counts per category
      const categoriesWithCounts: CategoryWithCount[] = await Promise.all(
        (cats || []).map(async (cat) => {
          const { count } = await supabase
            .from("gallery_images")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("is_active", true);
          
          return {
            ...cat,
            image_count: count || 0,
          };
        })
      );

      // Filter to only show categories with images
      return categoriesWithCounts.filter((cat) => cat.image_count > 0);
    },
  });

  // Fetch images for selected category
  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ["gallery-images", selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory) return [];
      
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*, vehicle_categories(name)")
        .eq("category_id", selectedCategory.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!selectedCategory,
  });

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (images) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          <div className="relative z-10 container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {selectedCategory 
                ? `Viewing ${selectedCategory.name} photos`
                : "Browse our collection by category"
              }
            </p>
          </div>
        </section>

        {/* Back Button when viewing category */}
        {selectedCategory && (
          <section className="py-4 container">
            <Button variant="ghost" onClick={handleBackToCategories} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Button>
          </section>
        )}

        {/* Categories Grid or Images Grid */}
        <section className="pb-16 container">
          {!selectedCategory ? (
            // Show Categories
            categoriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))}
              </div>
            ) : categories?.length === 0 ? (
              <div className="text-center py-16">
                <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No galleries yet</h3>
                <p className="text-muted-foreground">
                  Check back soon for our collection of safari photos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {categories?.map((category) => (
                  <Card
                    key={category.id}
                    className="overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="relative aspect-[4/3]">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.image_count} {category.image_count === 1 ? "photo" : "photos"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Show Images for Selected Category
            imagesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))}
              </div>
            ) : images?.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No photos yet</h3>
                <p className="text-muted-foreground">
                  This category doesn't have any photos yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images?.map((image, index) => (
                  <Card
                    key={image.id}
                    className="overflow-hidden group cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                        <h3 className="font-medium text-foreground">{image.title}</h3>
                        {image.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </section>
      </main>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-background/95 border-none">
          {images && images[currentImageIndex] && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <div className="relative aspect-[16/10] max-h-[80vh]">
                <img
                  src={images[currentImageIndex].image_url}
                  alt={images[currentImageIndex].title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 text-center">
                <h3 className="font-medium">{images[currentImageIndex].title}</h3>
                {images[currentImageIndex].description && (
                  <p className="text-muted-foreground mt-1">
                    {images[currentImageIndex].description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {currentImageIndex + 1} of {images.length}
                </p>
              </div>

              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Gallery;
