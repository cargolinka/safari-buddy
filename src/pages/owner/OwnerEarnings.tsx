import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OwnerEarnings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    byVehicle: [],
  });

  useEffect(() => {
    checkAuth();
    fetchEarnings();
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

  const fetchEarnings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get all completed bookings
      const { data: completedBookings, error } = await supabase
        .from("bookings")
        .select(`
          total_amount,
          created_at,
          vehicle_id,
          vehicles!inner(model, owner_id)
        `)
        .eq("vehicles.owner_id", session.user.id)
        .eq("status", "completed");

      if (error) throw error;

      const total = completedBookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      // Calculate this month's earnings
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = completedBookings
        ?.filter(b => new Date(b.created_at) >= firstDayThisMonth)
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      // Calculate last month's earnings
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayThisMonthAgain = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = completedBookings
        ?.filter(b => {
          const date = new Date(b.created_at);
          return date >= firstDayLastMonth && date < firstDayThisMonthAgain;
        })
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      // Calculate earnings by vehicle
      const byVehicle = completedBookings?.reduce((acc: any[], booking) => {
        const existing = acc.find(v => v.vehicle_id === booking.vehicle_id);
        if (existing) {
          existing.total += Number(booking.total_amount);
          existing.bookings += 1;
        } else {
          acc.push({
            vehicle_id: booking.vehicle_id,
            model: booking.vehicles.model,
            total: Number(booking.total_amount),
            bookings: 1,
          });
        }
        return acc;
      }, []) || [];

      // Sort by total earnings
      byVehicle.sort((a, b) => b.total - a.total);

      setEarnings({
        total,
        thisMonth,
        lastMonth,
        byVehicle,
      });
    } catch (error: any) {
      toast({
        title: "Error loading earnings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const growthPercentage = earnings.lastMonth > 0 
    ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/owner/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">Earnings</h1>
            <p className="text-muted-foreground">Track your revenue and financial performance</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading earnings...</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {earnings.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {earnings.thisMonth.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Number(growthPercentage) > 0 ? '+' : ''}{growthPercentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">vs last month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Earnings by Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings.byVehicle.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No earnings data available yet</p>
                ) : (
                  <div className="space-y-4">
                    {earnings.byVehicle.map((vehicle: any) => (
                      <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.bookings} {vehicle.bookings === 1 ? 'booking' : 'bookings'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">KES {vehicle.total.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
