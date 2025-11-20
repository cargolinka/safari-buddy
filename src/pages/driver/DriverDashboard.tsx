import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Calendar, DollarSign, LogOut, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    upcomingTrips: 0,
    totalEarnings: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchDriverData();
    fetchStats();
    fetchUpcomingTrips();
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

    if (roleData?.role !== "driver") {
      navigate("/dashboard");
    }
  };

  const fetchDriverData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      setDriver(data);
    } catch (error: any) {
      console.error("Error loading driver data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get completed trips count
      const { data: completedTrips, error: tripsError } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("driver_id", session.user.id)
        .eq("status", "completed");

      if (tripsError) throw tripsError;

      // Get upcoming trips count
      const { data: upcoming, error: upcomingError } = await supabase
        .from("bookings")
        .select("id")
        .eq("driver_id", session.user.id)
        .gte("pickup_date", new Date().toISOString().split("T")[0])
        .in("status", ["confirmed", "in_progress"]);

      if (upcomingError) throw upcomingError;

      const totalEarnings = completedTrips?.reduce((sum, t) => sum + Number(t.total_amount) * 0.3, 0) || 0; // 30% commission

      setStats({
        totalTrips: completedTrips?.length || 0,
        upcomingTrips: upcoming?.length || 0,
        totalEarnings,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const fetchUpcomingTrips = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles(model, type),
          profiles!bookings_client_id_fkey(full_name)
        `)
        .eq("driver_id", session.user.id)
        .gte("pickup_date", new Date().toISOString().split("T")[0])
        .in("status", ["confirmed", "in_progress"])
        .order("pickup_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingTrips(data || []);
    } catch (error: any) {
      console.error("Error loading upcoming trips:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  const isExpiringSoon = (date: string) => {
    const expiry = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 14 && daysUntilExpiry >= 0;
  };

  const hasExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Safari Hire - Driver Portal</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your driver overview.</p>
        </div>

        {/* License Status Alert */}
        {driver && (
          <div className="mb-6">
            {!driver.is_compliant ? (
              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">License Non-Compliant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">Your driver profile requires attention. Please update your documents.</p>
                  {hasExpired(driver.license_expiry) && (
                    <p className="text-sm text-destructive mb-2">• License has expired</p>
                  )}
                  {!driver.ntsa_verified && (
                    <p className="text-sm text-destructive mb-2">• NTSA verification pending</p>
                  )}
                  <Button onClick={() => navigate("/driver/profile")} variant="destructive" size="sm" className="mt-2">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            ) : isExpiringSoon(driver.license_expiry) ? (
              <Card className="border-yellow-600">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-yellow-600">License Expiring Soon</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Your license expires on {formatDate(driver.license_expiry)}. Please renew it soon.</p>
                  <Button onClick={() => navigate("/driver/profile")} variant="outline" size="sm" className="mt-2">
                    Update License
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-600">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-600">License Compliant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Your license is valid until {formatDate(driver.license_expiry)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips}</div>
              <p className="text-xs text-muted-foreground">Completed trips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingTrips}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats.totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/driver/trips")}>
            <CardHeader>
              <CardTitle>My Trips</CardTitle>
              <CardDescription>View and manage your assigned trips</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/driver/profile")}>
            <CardHeader>
              <CardTitle>Profile & License</CardTitle>
              <CardDescription>Manage your personal information and license</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{trip.vehicles?.model}</p>
                      <p className="text-sm text-muted-foreground">{trip.destination}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(trip.pickup_date)} - {formatDate(trip.dropoff_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge>{trip.status}</Badge>
                      <p className="text-sm font-medium mt-2">
                        KES {(Number(trip.total_amount) * 0.3).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate("/driver/trips")}
              >
                View All Trips
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
