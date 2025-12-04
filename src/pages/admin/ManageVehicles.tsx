import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AddVehicleDialog } from "@/components/admin/AddVehicleDialog";
import { EditVehicleDialog } from "@/components/admin/EditVehicleDialog";
import { Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ManageVehicles = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    // Reset subcategory when category changes
    if (selectedCategory !== "all") {
      setSelectedSubcategory("all");
    }
  }, [selectedCategory]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          profiles:owner_id (full_name),
          vehicle_subcategories:subcategory_id (id, name, category_id, vehicle_categories:category_id (id, name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_subcategories")
        .select("*, vehicle_categories:category_id (id, name)")
        .order("name");

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error: any) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
      fetchVehicles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setEditDialogOpen(true);
  };

  // Filter subcategories based on selected category
  const filteredSubcategories = selectedCategory === "all" 
    ? subcategories 
    : subcategories.filter(sub => sub.category_id === selectedCategory);

  // Filter vehicles based on selected filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const vehicleSubcategory = vehicle.vehicle_subcategories;
    const vehicleCategoryId = vehicleSubcategory?.vehicle_categories?.id;

    if (selectedCategory !== "all" && vehicleCategoryId !== selectedCategory) {
      return false;
    }

    if (selectedSubcategory !== "all" && vehicle.subcategory_id !== selectedSubcategory) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vehicles</h2>
          <p className="text-muted-foreground">Manage all vehicles on the platform</p>
        </div>
        <AddVehicleDialog onSuccess={fetchVehicles} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select 
                value={selectedSubcategory} 
                onValueChange={setSelectedSubcategory}
                disabled={filteredSubcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {filteredSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedSubcategory("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Vehicles 
            <Badge variant="secondary" className="ml-2">
              {filteredVehicles.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vehicles found matching the selected filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{vehicle.model} ({vehicle.year})</p>
                    {vehicle.registration_number && (
                      <p className="text-sm font-mono text-primary">{vehicle.registration_number}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Owner/Authorised Driver: {vehicle.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">Type: {vehicle.type}</p>
                    {vehicle.vehicle_subcategories && (
                      <p className="text-sm text-muted-foreground">
                        Category: {vehicle.vehicle_subcategories.vehicle_categories?.name} / {vehicle.vehicle_subcategories.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">Capacity: {vehicle.capacity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={vehicle.is_compliant ? "default" : "destructive"}>
                      {vehicle.is_compliant ? "Compliant" : "Non-compliant"}
                    </Badge>
                    <Badge variant={vehicle.status === "available" ? "default" : "secondary"}>
                      {vehicle.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this vehicle? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(vehicle.id)}>Delete</AlertDialogAction>
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

      <EditVehicleDialog
        vehicle={editingVehicle}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchVehicles}
      />
    </div>
  );
};

export default ManageVehicles;
