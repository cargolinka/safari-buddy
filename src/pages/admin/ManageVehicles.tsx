import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vehicles</h2>
        <p className="text-muted-foreground">Manage all vehicles on the platform</p>
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
                  <div>
                    <p className="font-medium">{vehicle.model} ({vehicle.year})</p>
                    <p className="text-sm text-muted-foreground">Owner: {vehicle.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">Type: {vehicle.type}</p>
                    <p className="text-sm text-muted-foreground">Capacity: {vehicle.capacity}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={vehicle.is_compliant ? "default" : "destructive"}>
                      {vehicle.is_compliant ? "Compliant" : "Non-compliant"}
                    </Badge>
                    <Badge variant={vehicle.status === "available" ? "default" : "secondary"}>
                      {vehicle.status}
                    </Badge>
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
