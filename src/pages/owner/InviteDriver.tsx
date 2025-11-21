import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Driver {
  id: string;
  license_number: string;
  license_expiry: string;
  status: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

interface Vehicle {
  id: string;
  model: string;
  type: string;
}

export default function InviteDriver() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    can_add_vehicles: false,
    can_edit_vehicles: false,
    can_view_earnings: false,
    can_manage_drivers: false
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, model, type')
      .eq('owner_id', user.id);

    if (error) {
      toast.error("Failed to fetch vehicles");
      return;
    }

    setVehicles(data || []);
  };

  const searchDrivers = async () => {
    if (!searchTerm) {
      toast.error("Please enter search term");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`id, license_number, license_expiry, status`)
        .or(`license_number.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        setDrivers([]);
        toast.info("No drivers found");
        setLoading(false);
        return;
      }

      // Fetch profiles separately
      const driverIds = data.map(d => d.id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', driverIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedData = data.map(driver => ({
        ...driver,
        profiles: profileMap.get(driver.id) || { full_name: 'Unknown', phone: '' }
      }));

      setDrivers(enrichedData);
      if (data?.length === 0) {
        toast.info("No drivers found");
      }
    } catch (error: any) {
      toast.error(error.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleInvite = async () => {
    if (!selectedDriver) {
      toast.error("Please select a driver");
      return;
    }

    if (selectedVehicles.length === 0) {
      toast.error("Please select at least one vehicle");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const assignments = selectedVehicles.map(vehicleId => ({
        driver_id: selectedDriver.id,
        vehicle_id: vehicleId,
        fleet_owner_id: user.id,
        status: 'pending',
        permissions: permissions
      }));

      const { error } = await supabase
        .from('driver_vehicle_assignments')
        .insert(assignments);

      if (error) throw error;

      toast.success("Invitation sent successfully!");
      navigate('/owner/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/owner/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">Invite Authorized Driver</h1>
        <p className="text-muted-foreground mb-6">Search and invite drivers to manage your vehicles</p>

        <div className="space-y-6">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>Search Drivers</CardTitle>
              <CardDescription>Find drivers by license number or phone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="License number or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchDrivers()}
                />
                <Button onClick={searchDrivers} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {drivers.length > 0 && (
                <div className="mt-4 space-y-2">
                  {drivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedDriver?.id === driver.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {driver.profiles.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{driver.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            License: {driver.license_number} | {driver.profiles.phone}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          driver.status === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {driver.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Selection */}
          {selectedDriver && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Select Vehicles</CardTitle>
                  <CardDescription>Choose vehicles to assign to this driver</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center space-x-2 border rounded p-3">
                      <Checkbox
                        id={vehicle.id}
                        checked={selectedVehicles.includes(vehicle.id)}
                        onCheckedChange={() => toggleVehicle(vehicle.id)}
                      />
                      <Label htmlFor={vehicle.id} className="flex-1 cursor-pointer">
                        {vehicle.model} ({vehicle.type})
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Set Permissions</CardTitle>
                  <CardDescription>Define what this driver can do</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_add_vehicles"
                      checked={permissions.can_add_vehicles}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_add_vehicles: checked as boolean })
                      }
                    />
                    <Label htmlFor="can_add_vehicles" className="font-normal cursor-pointer">
                      Can add vehicles
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_edit_vehicles"
                      checked={permissions.can_edit_vehicles}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_edit_vehicles: checked as boolean })
                      }
                    />
                    <Label htmlFor="can_edit_vehicles" className="font-normal cursor-pointer">
                      Can edit vehicles
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_earnings"
                      checked={permissions.can_view_earnings}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_earnings: checked as boolean })
                      }
                    />
                    <Label htmlFor="can_view_earnings" className="font-normal cursor-pointer">
                      Can view earnings
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_manage_drivers"
                      checked={permissions.can_manage_drivers}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_manage_drivers: checked as boolean })
                      }
                    />
                    <Label htmlFor="can_manage_drivers" className="font-normal cursor-pointer">
                      Can manage other drivers
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleInvite} disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
