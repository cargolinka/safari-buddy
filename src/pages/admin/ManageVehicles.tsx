import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AddVehicleDialog } from "@/components/admin/AddVehicleDialog";
import { Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ManageVehicles = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          profiles:owner_id (full_name)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vehicles</h2>
          <p className="text-muted-foreground">Manage all vehicles on the platform</p>
        </div>
        <AddVehicleDialog onSuccess={fetchVehicles} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{vehicle.model} ({vehicle.year})</p>
                    <p className="text-sm text-muted-foreground">Owner: {vehicle.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">Type: {vehicle.type}</p>
                    <p className="text-sm text-muted-foreground">Capacity: {vehicle.capacity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={vehicle.is_compliant ? "default" : "destructive"}>
                      {vehicle.is_compliant ? "Compliant" : "Non-compliant"}
                    </Badge>
                    <Badge variant={vehicle.status === "available" ? "default" : "secondary"}>
                      {vehicle.status}
                    </Badge>
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
    </div>
  );
};

export default ManageVehicles;
