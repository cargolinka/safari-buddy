import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Loader2, Plus, Car, Bus, Truck, CircleDot } from "lucide-react";
import SubcategoryDialog from "@/components/admin/SubcategoryDialog";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  category_id: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string;
  image_url: string | null;
}

const ManageSubcategories = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_categories")
        .select("id, name, slug, description, icon_name, image_url")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("Failed to load categories");
      console.error(error);
    }
  };

  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicle_subcategories")
        .select("*")
        .order("name");

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error: any) {
      toast.error("Failed to load subcategories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vehicle_subcategories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Subcategory deleted successfully");
      fetchSubcategories();
    } catch (error: any) {
      toast.error("Failed to delete subcategory");
      console.error(error);
    }
  };

  // Group subcategories by category
  const subcategoriesByCategory = useMemo(() => {
    const grouped: Record<string, Subcategory[]> = {};
    categories.forEach(cat => {
      grouped[cat.id] = subcategories.filter(sub => sub.category_id === cat.id);
    });
    return grouped;
  }, [subcategories, categories]);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Car: <Car className="h-5 w-5" />,
      Bus: <Bus className="h-5 w-5" />,
      Truck: <Truck className="h-5 w-5" />,
    };
    return icons[iconName] || <CircleDot className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Vehicle Subcategories</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage vehicle subcategories organized by category
          </p>
        </div>
        <SubcategoryDialog categories={categories} onSuccess={fetchSubcategories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories & Subcategories</CardTitle>
          <CardDescription>
            Expand each category to view and manage its subcategories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No categories found. Create categories first before adding subcategories.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-2">
              {categories.map((category) => {
                const categorySubcategories = subcategoriesByCategory[category.id] || [];
                
                return (
                  <AccordionItem 
                    key={category.id} 
                    value={category.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        {category.image_url ? (
                          <img 
                            src={category.image_url} 
                            alt={category.name}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                            {getIconComponent(category.icon_name)}
                          </div>
                        )}
                        <div className="text-left">
                          <h3 className="font-semibold">{category.name}</h3>
                          {category.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-auto mr-4">
                          {categorySubcategories.length} subcategories
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2 pb-4">
                        {categorySubcategories.length === 0 ? (
                          <div className="text-center py-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-3">
                              No subcategories yet
                            </p>
                            <SubcategoryDialog 
                              categories={categories} 
                              onSuccess={fetchSubcategories}
                              defaultCategoryId={category.id}
                            />
                          </div>
                        ) : (
                          <>
                            {categorySubcategories.map((subcategory) => (
                              <div
                                key={subcategory.id}
                                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <h4 className="font-medium">{subcategory.name}</h4>
                                  {subcategory.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                      {subcategory.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Slug: {subcategory.slug}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <SubcategoryDialog
                                    categories={categories}
                                    subcategory={subcategory}
                                    onSuccess={fetchSubcategories}
                                  />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{subcategory.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(subcategory.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2">
                              <SubcategoryDialog 
                                categories={categories} 
                                onSuccess={fetchSubcategories}
                                defaultCategoryId={category.id}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageSubcategories;
