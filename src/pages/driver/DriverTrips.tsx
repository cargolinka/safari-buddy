import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DriverTrips() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [updatingTrip, setUpdatingTrip] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchTrips();
  }, [filter]);

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

    if (roleData?.role !== "driver") {
      navigate("/dashboard");
    }
  };

  const fetchTrips = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from("bookings")
        .select(`
          *,
          vehicles(model, type),
          profiles!bookings_client_id_fkey(full_name, phone)
        `)
        .eq("driver_id", session.user.id)
        .order("pickup_date", { ascending: false });

      if (filter === "upcoming") {
        query = query
          .gte("pickup_date", new Date().toISOString().split("T")[0])
          .in("status", ["confirmed", "in_progress"]);
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      } else if (filter === "in_progress") {
        query = query.eq("status", "in_progress");
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading trips",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTripStatus = async (tripId: string, newStatus: string) => {
    try {
      setUpdatingTrip(tripId);

      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus as any })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trip updated",
        description: `Trip status updated to ${newStatus}`,
      });

      fetchTrips();
    } catch (error: any) {
      toast({
        title: "Error updating trip",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingTrip(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const variants: any = {
      pending: "outline",
      confirmed: "default",
      in_progress: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return variants[status] || "default";
  };

  const calculateDriverEarnings = (totalAmount: number) => {
    return (Number(totalAmount) * 0.3).toLocaleString(); // 30% commission
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/driver/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold">My Trips</h1>
              <p className="text-muted-foreground">View and manage your assigned trips</p>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trips found for the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{trip.vehicles?.model}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {trip.vehicles?.type}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(trip.status)}>
                      {trip.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Dates</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(trip.pickup_date)} - {formatDate(trip.dropoff_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Destination</p>
                        <p className="text-xs text-muted-foreground">{trip.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Client</p>
                        <p className="text-xs text-muted-foreground">
                          {trip.profiles?.full_name || "N/A"}
                        </p>
                        {trip.profiles?.phone && (
                          <p className="text-xs text-muted-foreground">{trip.profiles.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Your Earnings</p>
                        <p className="text-lg font-bold">KES {calculateDriverEarnings(trip.total_amount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {trip.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => updateTripStatus(trip.id, "in_progress")}
                        disabled={updatingTrip === trip.id}
                      >
                        {updatingTrip === trip.id ? "Updating..." : "Start Trip"}
                      </Button>
                    )}
                    {trip.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => updateTripStatus(trip.id, "completed")}
                        disabled={updatingTrip === trip.id}
                      >
                        {updatingTrip === trip.id ? "Updating..." : "Complete Trip"}
                      </Button>
                    )}
                    {trip.status === "completed" && (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
