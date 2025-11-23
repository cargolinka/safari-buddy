import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PendingDriverApprovals } from "@/components/admin/PendingDriverApprovals";
import { AddDriverDialog } from "@/components/admin/AddDriverDialog";
import { EditDriverDialog } from "@/components/admin/EditDriverDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";

const ManageDrivers = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

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
          profiles!inner (full_name, phone, country, email)
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

  const filteredDrivers = selectedCountry === "all" 
    ? drivers 
    : drivers.filter(d => d.profiles?.country === selectedCountry);

  const filteredPendingDrivers = selectedCountry === "all"
    ? pendingDrivers
    : pendingDrivers.filter(d => d.profiles?.country === selectedCountry);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Drivers</h2>
          <p className="text-muted-foreground">Review and manage driver registrations</p>
        </div>
        <AddDriverDialog onSuccess={fetchDrivers} />
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PendingDriverApprovals drivers={filteredPendingDrivers} onUpdate={fetchDrivers} />

      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredDrivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{driver.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.profiles?.email && `${driver.profiles.email} • `}
                      {driver.profiles?.country && `${driver.profiles.country}`}
                    </p>
                    <p className="text-sm text-muted-foreground">License: {driver.license_number}</p>
                    <p className="text-sm text-muted-foreground">Expiry: {driver.license_expiry}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={driver.is_compliant ? "default" : "destructive"}>
                      {driver.is_compliant ? "Compliant" : "Non-compliant"}
                    </Badge>
                    <Badge variant={driver.status === "available" ? "default" : "secondary"}>
                      {driver.status}
                    </Badge>
                    <EditDriverDialog driver={driver} onSuccess={fetchDrivers} />
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
