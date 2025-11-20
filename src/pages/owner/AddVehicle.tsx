import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VehicleForm from "@/components/owner/VehicleForm";

export default function AddVehicle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);
  const isEdit = !!id;

  useEffect(() => {
    checkAuth();
    if (isEdit) {
      fetchVehicle();
    }
  }, [id]);

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

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .eq("owner_id", session.user.id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error: any) {
      toast({
        title: "Error loading vehicle",
        description: error.message,
        variant: "destructive",
      });
      navigate("/owner/vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isEdit) {
        const { error } = await supabase
          .from("vehicles")
          .update(formData)
          .eq("id", id)
          .eq("owner_id", session.user.id);

        if (error) throw error;

        toast({
          title: "Vehicle updated",
          description: "Your vehicle has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert([{ ...formData, owner_id: session.user.id }]);

        if (error) throw error;

        toast({
          title: "Vehicle added",
          description: "Your vehicle has been added successfully.",
        });
      }

      navigate("/owner/vehicles");
    } catch (error: any) {
      toast({
        title: "Error saving vehicle",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/owner/vehicles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>
          <h1 className="text-3xl font-bold mt-4">
            {isEdit ? "Edit Vehicle" : "Add New Vehicle"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update your vehicle details" : "Register a new vehicle to your fleet"}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <VehicleForm 
          initialData={vehicle} 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </main>
    </div>
  );
}
