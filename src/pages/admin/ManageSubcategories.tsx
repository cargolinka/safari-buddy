import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
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
        .select("id, name")
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
        .select(`
          *,
          vehicle_categories!inner(name)
        `)
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Vehicle Subcategories</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage vehicle subcategories for better organization
          </p>
        </div>
        <SubcategoryDialog categories={categories} onSuccess={fetchSubcategories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Subcategories</CardTitle>
          <CardDescription>
            View and manage all vehicle subcategories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : subcategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No subcategories found. Create your first subcategory to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {subcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{subcategory.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({getCategoryName(subcategory.category_id)})
                      </span>
                    </div>
                    {subcategory.description && (
                      <p className="text-sm text-muted-foreground mt-1">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageSubcategories;
