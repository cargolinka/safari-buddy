import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PendingDriverApprovals } from "@/components/admin/PendingDriverApprovals";

const ManageDrivers = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      // Fetch all drivers
      const { data: allDrivers, error: allError } = await supabase
        .from("drivers")
        .select(`
          *,
          profiles:id (full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (allError) throw allError;
      
      // Separate non-compliant/pending from all (assuming non-compliant means pending verification)
      const pending = (allDrivers || []).filter(d => !d.is_compliant);
      const approved = (allDrivers || []).filter(d => d.is_compliant);
      
      setPendingDrivers(pending);
      setDrivers(approved);
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
        <h2 className="text-2xl font-bold text-foreground">Manage Drivers</h2>
        <p className="text-muted-foreground">Review and manage driver registrations</p>
      </div>

      <PendingDriverApprovals drivers={pendingDrivers} onUpdate={fetchDrivers} />

      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{driver.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">License: {driver.license_number}</p>
                    <p className="text-sm text-muted-foreground">Expiry: {driver.license_expiry}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={driver.is_compliant ? "default" : "destructive"}>
                      {driver.is_compliant ? "Compliant" : "Non-compliant"}
                    </Badge>
                    <Badge variant={driver.status === "available" ? "default" : "secondary"}>
                      {driver.status}
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

export default ManageDrivers;
