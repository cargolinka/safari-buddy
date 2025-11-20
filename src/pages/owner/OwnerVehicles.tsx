import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VehicleCard from "@/components/owner/VehicleCard";

export default function OwnerVehicles() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchVehicles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "owner") {
      navigate("/dashboard");
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading vehicles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/owner/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Vehicles</h1>
              <p className="text-muted-foreground">Manage your fleet</p>
            </div>
            <Button onClick={() => navigate("/owner/vehicles/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't added any vehicles yet.</p>
            <Button onClick={() => navigate("/owner/vehicles/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Vehicle
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onUpdate={fetchVehicles} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
