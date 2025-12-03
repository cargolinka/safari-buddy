import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, FileCheck, Calendar, DollarSign, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRoleVerification } from "@/hooks/useRoleVerification";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { loading, isAuthorized, session } = useRoleVerification({ requiredRole: "owner" });
  
  const [stats, setStats] = useState({
    totalVehicles: 0,
    compliantVehicles: 0,
    upcomingBookings: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (isAuthorized && session) {
      fetchStats();
    }
  }, [isAuthorized, session]);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get vehicle stats
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("owner_id", session.user.id);

      if (vehiclesError) throw vehiclesError;

      const compliant = vehicles?.filter(v => v.is_compliant) || [];

      // Get upcoming bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*, vehicles!inner(*)")
        .eq("vehicles.owner_id", session.user.id)
        .gte("pickup_date", new Date().toISOString().split("T")[0])
        .eq("status", "confirmed");

      if (bookingsError) throw bookingsError;

      // Calculate total earnings from completed bookings
      const { data: completedBookings, error: earningsError } = await supabase
        .from("bookings")
        .select("total_amount, vehicles!inner(*)")
        .eq("vehicles.owner_id", session.user.id)
        .eq("status", "completed");

      if (earningsError) throw earningsError;

      const totalEarnings = completedBookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      setStats({
        totalVehicles: vehicles?.length || 0,
        compliantVehicles: compliant.length,
        upcomingBookings: bookings?.length || 0,
        totalEarnings,
      });
    } catch (error: any) {
      toast({
        title: "Error loading stats",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
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
          <h1 className="text-2xl font-bold">Safari Hire - Owner Portal</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your vehicles.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliant Vehicles</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.compliantVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalVehicles - stats.compliantVehicles} need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/owner/vehicles")}>
            <CardHeader>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>Manage your fleet, add new vehicles, and track compliance</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/owner/bookings")}>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>View and manage bookings for your vehicles</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/owner/earnings")}>
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>Track your revenue and financial performance</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/owner/vehicles/new")}>
            <CardHeader>
              <CardTitle>Add New Vehicle</CardTitle>
              <CardDescription>Register a new vehicle to your fleet</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
