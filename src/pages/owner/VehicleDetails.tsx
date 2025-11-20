import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, CheckCircle, AlertTriangle, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VehicleDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchVehicle();
    fetchBookings();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
  };

  const fetchVehicle = async () => {
    try {
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

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("vehicle_id", id)
        .order("pickup_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      available: "default",
      booked: "secondary",
      maintenance: "outline",
      unavailable: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/owner/vehicles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{vehicle.model}</h1>
            <div className="flex gap-2 items-center">
              {getStatusBadge(vehicle.status)}
              {vehicle.is_compliant ? (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compliant
                </Badge>
              ) : (
                <Badge variant="outline" className="text-destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Non-Compliant
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={() => navigate(`/owner/vehicles/edit/${vehicle.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vehicle
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {vehicle.image_url && (
              <Card>
                <CardContent className="p-0">
                  <img 
                    src={vehicle.image_url} 
                    alt={vehicle.model}
                    className="w-full h-96 object-cover rounded-t-lg"
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {vehicle.capacity} seats
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Rate</p>
                    <p className="font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      KES {Number(vehicle.daily_rate).toLocaleString()}
                    </p>
                  </div>
                </div>

                {vehicle.features && vehicle.features.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.features.map((feature: string) => (
                        <Badge key={feature} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{booking.destination}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(booking.pickup_date)} - {formatDate(booking.dropoff_date)}
                          </p>
                        </div>
                        <Badge>{booking.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Insurance</span>
                    {new Date(vehicle.insurance_expiry) > new Date() ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {formatDate(vehicle.insurance_expiry)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Inspection</span>
                    {new Date(vehicle.inspection_expiry) > new Date() ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {formatDate(vehicle.inspection_expiry)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Road License</span>
                    {new Date(vehicle.road_license_expiry) > new Date() ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {formatDate(vehicle.road_license_expiry)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
