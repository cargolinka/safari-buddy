import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

const ManageCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
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

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from("vehicle_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("vehicle_categories")
        .update({ is_active: !currentStatus })
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Category ${!currentStatus ? "published" : "hidden"} successfully`,
      });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-6 w-6 text-primary mt-1" /> : <LucideIcons.Car className="h-6 w-6 text-primary mt-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vehicle Categories</h2>
          <p className="text-muted-foreground">Manage vehicle types and categories</p>
        </div>
        <CategoryDialog onSuccess={fetchCategories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-start gap-3">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    ) : (
                      getIconComponent(category.icon_name)
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{category.name}</h3>
                          {!category.is_active && (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                        <Badge variant="outline">{category.slug}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-2 mr-2">
                          <Switch
                            checked={category.is_active}
                            onCheckedChange={() => handleToggleActive(category.id, category.is_active)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {category.is_active ? "Published" : "Hidden"}
                          </span>
                        </div>
                        <CategoryDialog category={category} onSuccess={fetchCategories} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this category? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
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

export default ManageCategories;
